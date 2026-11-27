using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Common;
using SkyBridge.Application.Pilots;
using SkyBridge.Application.Pireps;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.Freelance;
using SkyBridge.Domain.Pireps;
using SkyBridge.Infrastructure.Airports;
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

    public async Task<Result<LogbookResponse>> GetLogbookAsync(Guid userId, LogbookSearch search, CancellationToken cancellationToken)
    {
        if (!LogbookPeriods.TrySince(search.Period, time.GetUtcNow().UtcDateTime, out var period, out var since))
            return Result<LogbookResponse>.Invalid("Period", "Use 30d, 1y or all.");

        var page = Math.Max(search.Page, 1);
        var pageSize = Math.Clamp(search.PageSize, 1, 100);

        var query = db.Pireps.AsNoTracking().Where(p => p.PilotUserId == userId);
        if (since is { } from)
            query = query.Where(p => p.ArrivedAtUtc >= from);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(p => p.ArrivedAtUtc)
            .ThenByDescending(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var flown = await query
            .Where(p => p.Status != PirepStatus.Rejected)
            .Select(p => new { p.OriginAirportId, p.DestinationAirportId, p.FlightMinutes, p.DistanceNm, p.LandingRateFpm, p.AircraftTypeId })
            .ToListAsync(cancellationToken);

        var payments = db.PilotTransactions.AsNoTracking().Where(t => t.PilotUserId == userId && t.Amount > 0);
        if (since is { } paidFrom)
            payments = payments.Where(t => t.CreatedAtUtc >= paidFrom);
        var earned = await payments.SumAsync(t => (int?)t.Amount, cancellationToken) ?? 0;

        var favoriteId = flown
            .GroupBy(f => f.AircraftTypeId)
            .OrderByDescending(g => g.Count())
            .ThenBy(g => g.Key)
            .Select(g => (int?)g.Key)
            .FirstOrDefault();
        var favorite = favoriteId is { } typeId
            ? await db.AircraftTypes.AsNoTracking().Where(t => t.Id == typeId).Select(t => t.IcaoCode).FirstOrDefaultAsync(cancellationToken)
            : null;

        var landings = flown.Where(f => f.LandingRateFpm is not null).Select(f => f.LandingRateFpm!.Value).ToList();
        var airportIds = flown.SelectMany(f => new[] { f.OriginAirportId, f.DestinationAirportId }).Distinct().ToList();
        var airports = (await db.Airports.AsNoTracking()
                .Where(a => airportIds.Contains(a.Id))
                .ToListAsync(cancellationToken))
            .OrderBy(AirportCodes.Display, StringComparer.Ordinal)
            .ToList();
        var index = airports.Select((airport, position) => (airport.Id, position)).ToDictionary(x => x.Id, x => x.position);
        var links = flown
            .Select(f => (A: index[f.OriginAirportId], B: index[f.DestinationAirportId]))
            .Where(l => l.A != l.B)
            .Select(l => (From: Math.Min(l.A, l.B), To: Math.Max(l.A, l.B)))
            .Distinct()
            .OrderBy(l => l.From)
            .ThenBy(l => l.To)
            .Select(l => new[] { l.From, l.To })
            .ToList();

        var summary = new LogbookSummary(
            flown.Count,
            flown.Sum(f => f.FlightMinutes),
            flown.Sum(f => f.DistanceNm),
            earned,
            landings.Count == 0 ? null : (int)Math.Round(landings.Average()),
            airports.Count,
            favorite);
        var network = new RouteNetworkResponse(
            airports.Select(a => new NetworkAirport(AirportCodes.Display(a), a.IataCode, a.Name, a.Latitude, a.Longitude)).ToList(),
            links);
        var flights = new PagedResult<PirepResponse>(await mapper.ToResponsesAsync(items, cancellationToken), page, pageSize, total);

        return Result<LogbookResponse>.Ok(new LogbookResponse(period, summary, network, flights));
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