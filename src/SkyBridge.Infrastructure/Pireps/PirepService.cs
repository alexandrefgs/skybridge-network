using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Common;
using SkyBridge.Application.Pilots;
using SkyBridge.Application.Pireps;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.Freelance;
using SkyBridge.Domain.Pireps;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Pireps;

internal sealed class PirepService(
    SkyBridgeDbContext db,
    PirepMapper mapper,
    RewardPayer rewards,
    IBookingService bookings,
    IPilotService pilots,
    TimeProvider time) : IPirepService
{
    public async Task<Result<PirepFiledResponse>> FileAsync(Guid userId, FilePirepRequest request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow().UtcDateTime;

        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.PilotUserId == userId && b.Status == BookingStatus.Active, cancellationToken);
        if (booking is null)
            return Result<PirepFiledResponse>.NotFound();
        if (booking.LegStartedAtUtc is not { } legStartedAtUtc)
            return Invalid("Booking", "Start the leg before filing the PIREP.");

        var leg = await LegAsync(booking, cancellationToken);
        if (leg is null)
            return Invalid("Booking", $"Leg {booking.CurrentLeg} of this flight was not found.");

        var type = await db.AircraftTypes.AsNoTracking().FirstAsync(t => t.Id == booking.AircraftTypeId, cancellationToken);
        var pilot = await db.Pilots.FirstAsync(p => p.UserId == userId, cancellationToken);

        Pirep pirep;
        try
        {
            pirep = Pirep.File(
                new PirepLeg(booking.Id, userId, booking.CurrentLeg, leg.OriginAirportId, leg.DestinationAirportId, leg.DistanceNm,
                    type.Id, type.IcaoCode, type.CruiseSpeedKts, legStartedAtUtc),
                new PirepTimes(AsUtc(request.DepartedAtUtc), AsUtc(request.ArrivedAtUtc), request.FuelUsedKg, request.LandingRateFpm, request.Remarks),
                now);
        }
        catch (ArgumentException exception)
        {
            return Invalid(nameof(request.ArrivedAtUtc), exception.Message.Split(" (Parameter")[0]);
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        db.Pireps.Add(pirep);
        booking.CompleteLeg(now);
        pilot.MoveTo(leg.DestinationAirportId);
        if (pirep.Status == PirepStatus.Accepted)
            pilot.LogFlight(pirep.FlightMinutes);

        await db.SaveChangesAsync(cancellationToken);
        var paid = await rewards.PayIfDueAsync(booking, pilot, now, cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Result<PirepFiledResponse>.Ok(new PirepFiledResponse(
            await mapper.ToResponseAsync(pirep, cancellationToken),
            await bookings.GetCurrentAsync(userId, cancellationToken),
            paid,
            await pilots.GetAsync(userId, cancellationToken)));
    }

    public async Task<PagedResult<PirepResponse>> GetMineAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Pireps.AsNoTracking().Where(p => p.PilotUserId == userId);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(p => p.FiledAtUtc)
            .ThenByDescending(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<PirepResponse>(await mapper.ToResponsesAsync(items, cancellationToken), page, pageSize, total);
    }

    private async Task<LegInfo?> LegAsync(Booking booking, CancellationToken cancellationToken)
    {
        if (booking.Source == BookingSource.Airline)
            return new LegInfo(booking.OriginAirportId!.Value, booking.DestinationAirportId!.Value, booking.DistanceNm);

        return await db.Set<FreelanceJobLeg>().AsNoTracking()
            .Where(l => l.FreelanceJobId == booking.FreelanceJobId && l.Sequence == booking.CurrentLeg)
            .Select(l => new LegInfo(l.OriginAirportId, l.DestinationAirportId, l.DistanceNm))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private sealed record LegInfo(int OriginAirportId, int DestinationAirportId, int DistanceNm);

    private static DateTime AsUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    private static Result<PirepFiledResponse> Invalid(string field, string message) => Result<PirepFiledResponse>.Invalid(field, message);
}