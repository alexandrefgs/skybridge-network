using System.Globalization;
using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Common;
using SkyBridge.Application.Freelance;
using SkyBridge.Domain.Bookings;
using SkyBridge.Infrastructure.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Bookings;

internal sealed class BookingService(SkyBridgeDbContext db, IFreelanceQueries freelance, TimeProvider time) : IBookingService
{
    public async Task<BookingResponse?> GetCurrentAsync(Guid userId, CancellationToken cancellationToken)
    {
        var booking = await ActiveAsync(userId, cancellationToken);
        return booking is null ? null : await ToResponseAsync(booking, cancellationToken);
    }

    public async Task<bool> HasActiveAsync(Guid userId, CancellationToken cancellationToken) =>
        await ActiveAsync(userId, cancellationToken) is not null;

    public async Task<Result<BookingResponse>> AcceptFreelanceJobAsync(Guid userId, int jobId, AcceptJobRequest request, CancellationToken cancellationToken)
    {
        var now = Now();

        var job = await db.FreelanceJobs.AsNoTracking()
            .Include(j => j.Aircraft)
            .Include(j => j.Legs)
            .AsSplitQuery()
            .FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);
        if (job is null)
            return Result<BookingResponse>.NotFound();
        if (job.IsExpired(now))
            return Invalid("Job", "This job has expired.");

        var pilot = await db.Pilots.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (pilot?.CurrentAirportId is null)
            return Invalid("Job", "Choose where your career starts before accepting a job.");

        if (pilot.CurrentAirportId != job.OriginAirportId)
        {
            var origin = await db.Airports.AsNoTracking().FirstAsync(a => a.Id == job.OriginAirportId, cancellationToken);
            return Invalid("Job", $"This job departs from {AirportCodes.Display(origin)}. Take a jumpseat there first.");
        }

        var code = request.Aircraft.Trim().ToUpperInvariant();
        var type = await db.AircraftTypes.AsNoTracking().FirstOrDefaultAsync(t => t.IcaoCode == code, cancellationToken);
        if (type is null || job.Aircraft.All(a => a.AircraftTypeId != type.Id))
            return Invalid("Aircraft", $"{code} is not allowed on this job.");

        var category = await db.AircraftCategories.AsNoTracking().FirstAsync(c => c.Code == type.Category, cancellationToken);
        if (!category.IsUnlockedFor(pilot.FlightHours))
            return Invalid("Aircraft",
                $"{type.IcaoCode} is a {category.Name} aircraft and needs {category.RequiredHours} h. You have {pilot.FlightHours.ToString("0.0", CultureInfo.InvariantCulture)} h.");

        if (await ActiveAsync(userId, cancellationToken) is not null)
            return Result<BookingResponse>.Conflict("Booking", "You already have an active flight. Finish or cancel it first.");

        if (await db.Bookings.AnyAsync(b => b.FreelanceJobId == jobId && (b.Status == BookingStatus.Active || b.Status == BookingStatus.Completed), cancellationToken))
            return Result<BookingResponse>.Conflict("Job", "Another pilot has already taken this job.");

        var booking = Booking.ForFreelanceJob(userId, job.Id, type.Id, job.Legs.Count, job.Reward, job.ExpiresAtUtc, now);
        db.Bookings.Add(booking);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Result<BookingResponse>.Conflict("Job", "Another pilot has already taken this job.");
        }

        return Result<BookingResponse>.Ok(await ToResponseAsync(booking, cancellationToken));
    }

    public async Task<Result<BookingResponse>> StartLegAsync(Guid userId, CancellationToken cancellationToken)
    {
        var booking = await ActiveAsync(userId, cancellationToken);
        if (booking is null)
            return Result<BookingResponse>.NotFound();

        try
        {
            booking.StartLeg(Now());
        }
        catch (InvalidOperationException exception)
        {
            return Invalid("Booking", exception.Message);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Result<BookingResponse>.Ok(await ToResponseAsync(booking, cancellationToken));
    }

    public async Task<bool> CancelAsync(Guid userId, CancellationToken cancellationToken)
    {
        var booking = await ActiveAsync(userId, cancellationToken);
        if (booking is null)
            return false;

        booking.Cancel(Now());
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<Booking?> ActiveAsync(Guid userId, CancellationToken cancellationToken)
    {
        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.PilotUserId == userId && b.Status == BookingStatus.Active, cancellationToken);
        var now = Now();
        if (booking is null || !booking.IsOverdue(now))
            return booking;

        booking.Expire(now);
        await db.SaveChangesAsync(cancellationToken);
        return null;
    }

    private async Task<BookingResponse> ToResponseAsync(Booking booking, CancellationToken cancellationToken)
    {
        var aircraft = await db.AircraftTypes.AsNoTracking()
            .Where(t => t.Id == booking.AircraftTypeId)
            .Select(t => t.IcaoCode)
            .FirstAsync(cancellationToken);

        var job = booking.FreelanceJobId is { } jobId ? await freelance.GetAsync(jobId, cancellationToken) : null;

        return new BookingResponse(
            booking.Id,
            booking.Status.ToString(),
            booking.Source.ToString(),
            aircraft,
            booking.CurrentLeg,
            booking.LegCount,
            booking.LegInProgress,
            Utc(booking.BookedAtUtc),
            Utc(booking.StartDeadlineUtc),
            booking.StartedAtUtc is { } started ? Utc(started) : null,
            booking.LegStartedAtUtc is { } legStarted ? Utc(legStarted) : null,
            job);
    }

    private DateTime Now() => time.GetUtcNow().UtcDateTime;

    private static DateTime Utc(DateTime value) => DateTime.SpecifyKind(value, DateTimeKind.Utc);

    private static Result<BookingResponse> Invalid(string field, string message) => Result<BookingResponse>.Invalid(field, message);
}