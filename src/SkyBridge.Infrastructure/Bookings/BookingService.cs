using System.Globalization;
using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Common;
using SkyBridge.Application.FlightPlans;
using SkyBridge.Application.Freelance;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Airlines;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.FlightPlans;
using SkyBridge.Domain.Freelance;
using SkyBridge.Domain.Routes;
using SkyBridge.Infrastructure.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Bookings;

internal sealed class BookingService(SkyBridgeDbContext db, IFreelanceQueries freelance, ISimBriefClient simBrief, TimeProvider time) : IBookingService
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

        var check = await CheckAsync(userId, job.OriginAirportId, "job", job.Aircraft.Select(a => a.AircraftTypeId).ToList(), request.Aircraft, cancellationToken);
        if (check.Error is not null)
            return check.Error;

        if (await db.Bookings.AnyAsync(b => b.FreelanceJobId == jobId && (b.Status == BookingStatus.Active || b.Status == BookingStatus.Completed), cancellationToken))
            return Result<BookingResponse>.Conflict("Job", "Another pilot has already taken this job.");

        var booking = Booking.ForFreelanceJob(userId, job.Id, check.Type!.Id, job.Legs.Count, job.Reward, job.ExpiresAtUtc, now);
        return await SaveAsync(booking, "Another pilot has already taken this job.", cancellationToken);
    }

    public async Task<Result<BookingResponse>> BookRouteAsync(Guid userId, int routeId, AcceptJobRequest request, CancellationToken cancellationToken)
    {
        var route = await db.Routes.AsNoTracking().FirstOrDefaultAsync(r => r.Id == routeId, cancellationToken);
        if (route is null)
            return Result<BookingResponse>.NotFound();

        var airline = await db.Airlines.AsNoTracking().FirstAsync(a => a.Id == route.AirlineId, cancellationToken);
        if (!airline.IsActive)
            return Invalid("Route", $"{airline.Name} is not operating at the moment.");

        var scheduled = await db.Set<RouteAircraft>().AsNoTracking()
            .Where(a => a.RouteId == routeId)
            .Join(db.AircraftTypes, a => a.AircraftTypeId, t => t.Id, (a, t) => new FamilyMember(t.Id, t.Family))
            .ToListAsync(cancellationToken);
        if (scheduled.Count == 0)
            return Invalid("Aircraft", "No aircraft is assigned to this route yet.");

        var fleet = await db.Set<AirlineAircraft>().AsNoTracking()
            .Where(f => f.AirlineId == airline.Id)
            .Join(db.AircraftTypes, f => f.AircraftTypeId, t => t.Id, (f, t) => new FamilyMember(t.Id, t.Family))
            .ToListAsync(cancellationToken);
        var allowed = AircraftFamilies.Bookable(scheduled, fleet).ToList();

        var check = await CheckAsync(userId, route.OriginAirportId, "flight", allowed, request.Aircraft, cancellationToken);
        if (check.Error is not null)
            return check.Error;

        var flight = new AirlineFlight(
            route.Id,
            Booking.FlightNumberFor(airline.IcaoCode, airline.IataCode, route.Id),
            airline.Name,
            route.OriginAirportId,
            route.DestinationAirportId,
            route.DistanceNm);
        var booking = Booking.ForAirlineFlight(userId, flight, check.Type!.Id, check.Category!.PayPerHour, Now());
        return await SaveAsync(booking, "You already have an active flight. Finish or cancel it first.", cancellationToken);
    }

    public async Task<Result<BookingResponse>> ImportFlightPlanAsync(Guid userId, CancellationToken cancellationToken)
    {
        var booking = await ActiveAsync(userId, cancellationToken);
        if (booking is null)
            return Result<BookingResponse>.NotFound();
        if (booking.LegInProgress)
            return Invalid("FlightPlan", $"Leg {booking.CurrentLeg} is already in progress. The OFP can only change before the leg starts.");

        var pilotId = await db.Pilots.AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => p.SimBriefPilotId)
            .FirstOrDefaultAsync(cancellationToken);
        if (pilotId is null)
            return Invalid("FlightPlan", "Add your SimBrief Pilot ID first.");

        var fetched = await simBrief.FetchLatestAsync(pilotId, cancellationToken);
        if (fetched.Plan is not { } data)
            return Invalid("FlightPlan", fetched.Error ?? "SimBrief could not find a flight plan.");

        var leg = await LegAsync(booking, cancellationToken);
        var aircraft = await db.AircraftTypes.AsNoTracking()
            .Where(t => t.Id == booking.AircraftTypeId)
            .Select(t => t.IcaoCode)
            .FirstAsync(cancellationToken);

        var problems = FlightPlan.Problems(data, leg.Origin, leg.Destination, aircraft, booking.BookedAtUtc);
        if (problems.Count > 0)
            return new Result<BookingResponse>(ResultStatus.Invalid, null, new() { ["FlightPlan"] = [.. problems] });

        var now = Now();
        var plan = await db.FlightPlans.FirstOrDefaultAsync(p => p.BookingId == booking.Id && p.LegSequence == booking.CurrentLeg, cancellationToken);
        if (plan is null)
            db.FlightPlans.Add(FlightPlan.Create(booking.Id, booking.CurrentLeg, data, now));
        else
            plan.Replace(data, now);

        await db.SaveChangesAsync(cancellationToken);
        return Result<BookingResponse>.Ok(await ToResponseAsync(booking, cancellationToken));
    }

    public async Task<Result<BookingResponse>> StartLegAsync(Guid userId, CancellationToken cancellationToken)
    {
        var booking = await ActiveAsync(userId, cancellationToken);
        if (booking is null)
            return Result<BookingResponse>.NotFound();

        if (!booking.LegInProgress &&
            !await db.FlightPlans.AnyAsync(p => p.BookingId == booking.Id && p.LegSequence == booking.CurrentLeg, cancellationToken))
            return Invalid("FlightPlan", $"Import the SimBrief OFP for leg {booking.CurrentLeg} before starting it.");

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

    private async Task<BookingCheck> CheckAsync(Guid userId, int originAirportId, string what, IReadOnlyCollection<int> allowedTypeIds,
        string aircraft, CancellationToken cancellationToken)
    {
        var pilot = await db.Pilots.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (pilot?.CurrentAirportId is null)
            return BookingCheck.Fail(Invalid("Booking", $"Choose where your career starts before booking a {what}."));

        if (pilot.CurrentAirportId != originAirportId)
        {
            var origin = await db.Airports.AsNoTracking().FirstAsync(a => a.Id == originAirportId, cancellationToken);
            var article = what == "job" ? "This job" : "This flight";
            return BookingCheck.Fail(Invalid("Booking", $"{article} departs from {AirportCodes.Display(origin)}. Take a jumpseat there first."));
        }

        var code = aircraft.Trim().ToUpperInvariant();
        var type = await db.AircraftTypes.AsNoTracking().FirstOrDefaultAsync(t => t.IcaoCode == code, cancellationToken);
        if (type is null || !allowedTypeIds.Contains(type.Id))
            return BookingCheck.Fail(Invalid("Aircraft", $"{code} is not allowed on this {what}."));

        var category = await db.AircraftCategories.AsNoTracking().FirstAsync(c => c.Code == type.Category, cancellationToken);
        if (!category.IsUnlockedFor(pilot.FlightHours))
            return BookingCheck.Fail(Invalid("Aircraft",
                $"{type.IcaoCode} is a {category.Name} aircraft and needs {category.RequiredHours} h. You have {pilot.FlightHours.ToString("0.0", CultureInfo.InvariantCulture)} h."));

        if (await ActiveAsync(userId, cancellationToken) is not null)
            return BookingCheck.Fail(Result<BookingResponse>.Conflict("Booking", "You already have an active flight. Finish or cancel it first."));

        return new BookingCheck(null, type, category);
    }

    private async Task<Result<BookingResponse>> SaveAsync(Booking booking, string conflictMessage, CancellationToken cancellationToken)
    {
        db.Bookings.Add(booking);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Result<BookingResponse>.Conflict("Booking", conflictMessage);
        }

        return Result<BookingResponse>.Ok(await ToResponseAsync(booking, cancellationToken));
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
            .Select(t => new { t.IcaoCode, t.EngineType })
            .FirstAsync(cancellationToken);

        var job = booking.FreelanceJobId is { } jobId ? await freelance.GetAsync(jobId, cancellationToken) : null;
        var flight = booking.Source == BookingSource.Airline ? await FlightAsync(booking, cancellationToken) : null;
        var plan = await db.FlightPlans.AsNoTracking()
            .FirstOrDefaultAsync(p => p.BookingId == booking.Id && p.LegSequence == booking.CurrentLeg, cancellationToken);

        return new BookingResponse(
            booking.Id,
            booking.Status.ToString(),
            booking.Source.ToString(),
            aircraft.IcaoCode,
            booking.CurrentLeg,
            booking.LegCount,
            booking.LegInProgress,
            Utc(booking.BookedAtUtc),
            Utc(booking.StartDeadlineUtc),
            booking.StartedAtUtc is { } started ? Utc(started) : null,
            booking.LegStartedAtUtc is { } legStarted ? Utc(legStarted) : null,
            job,
            booking.FlightNumber,
            booking.PayPerHour,
            flight,
            plan is null ? null : ToResponse(plan),
            aircraft.EngineType.ToString());
    }

    private static FlightPlanResponse ToResponse(FlightPlan plan) => new(
        plan.LegSequence,
        plan.SimBriefId,
        Utc(plan.GeneratedAtUtc),
        Utc(plan.ImportedAtUtc),
        plan.Airac,
        plan.Origin,
        plan.Destination,
        plan.Alternate,
        plan.Aircraft,
        plan.Registration,
        plan.Callsign,
        plan.Route,
        plan.CruiseAltitudeFt,
        plan.DistanceNm,
        plan.EnrouteMinutes,
        plan.BlockFuelKg,
        plan.TakeoffFuelKg,
        plan.LandingFuelKg,
        plan.TripFuelKg,
        plan.PassengerCount,
        plan.CargoKg,
        plan.ZeroFuelWeightKg,
        plan.TakeoffWeightKg,
        plan.LandingWeightKg,
        plan.ReadDetails());

    private async Task<(string Origin, string Destination)> LegAsync(Booking booking, CancellationToken cancellationToken)
    {
        int originId, destinationId;
        if (booking.Source == BookingSource.Airline)
        {
            originId = booking.OriginAirportId!.Value;
            destinationId = booking.DestinationAirportId!.Value;
        }
        else
        {
            var leg = await db.Set<FreelanceJobLeg>().AsNoTracking()
                .Where(l => l.FreelanceJobId == booking.FreelanceJobId && l.Sequence == booking.CurrentLeg)
                .Select(l => new { l.OriginAirportId, l.DestinationAirportId })
                .FirstAsync(cancellationToken);
            originId = leg.OriginAirportId;
            destinationId = leg.DestinationAirportId;
        }

        var ids = new[] { originId, destinationId };
        var airports = await db.Airports.AsNoTracking()
            .Where(a => ids.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, AirportCodes.Display, cancellationToken);
        return (airports[originId], airports[destinationId]);
    }

    private async Task<AirlineFlightResponse> FlightAsync(Booking booking, CancellationToken cancellationToken)
    {
        var ids = new[] { booking.OriginAirportId!.Value, booking.DestinationAirportId!.Value };
        var airports = await db.Airports.AsNoTracking()
            .Where(a => ids.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, cancellationToken);
        var route = booking.RouteId is { } routeId
            ? await db.Routes.AsNoTracking().FirstOrDefaultAsync(r => r.Id == routeId, cancellationToken)
            : null;

        var origin = airports[booking.OriginAirportId.Value];
        var destination = airports[booking.DestinationAirportId.Value];
        return new AirlineFlightResponse(
            route?.Id,
            booking.FlightNumber!,
            booking.AirlineName!,
            AirportCodes.Display(origin),
            origin.Name,
            AirportCodes.Display(destination),
            destination.Name,
            booking.DistanceNm,
            route?.AtsRoute,
            route?.FlightLevel);
    }

    private DateTime Now() => time.GetUtcNow().UtcDateTime;

    private static DateTime Utc(DateTime value) => DateTime.SpecifyKind(value, DateTimeKind.Utc);

    private static Result<BookingResponse> Invalid(string field, string message) => Result<BookingResponse>.Invalid(field, message);

    private sealed record BookingCheck(Result<BookingResponse>? Error, AircraftType? Type, AircraftCategory? Category)
    {
        public static BookingCheck Fail(Result<BookingResponse> error) => new(error, null, null);
    }
}