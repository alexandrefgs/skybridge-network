using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Pireps;
using SkyBridge.Domain.Pireps;
using SkyBridge.Infrastructure.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Pireps;

internal sealed class PirepMapper(SkyBridgeDbContext db)
{
    public async Task<PirepResponse> ToResponseAsync(Pirep pirep, CancellationToken cancellationToken) =>
        (await ToResponsesAsync([pirep], cancellationToken))[0];

    public async Task<IReadOnlyList<PirepResponse>> ToResponsesAsync(IReadOnlyList<Pirep> pireps, CancellationToken cancellationToken)
    {
        var airportIds = pireps.SelectMany(p => new[] { p.OriginAirportId, p.DestinationAirportId }).Distinct().ToList();
        var typeIds = pireps.Select(p => p.AircraftTypeId).Distinct().ToList();
        var bookingIds = pireps.Select(p => p.BookingId).Distinct().ToList();
        var userIds = pireps.Select(p => p.PilotUserId).Distinct().ToList();

        var airports = await db.Airports.AsNoTracking()
            .Where(a => airportIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, AirportCodes.Display, cancellationToken);
        var types = await db.AircraftTypes.AsNoTracking()
            .Where(t => typeIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.IcaoCode, cancellationToken);
        var legCounts = await db.Bookings.AsNoTracking()
            .Where(b => bookingIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.LegCount, cancellationToken);
        var pilots = await db.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => $"{u.FirstName} {u.LastName}".Trim(), cancellationToken);

        return pireps.Select(p => new PirepResponse(
                p.Id,
                p.BookingId,
                pilots.GetValueOrDefault(p.PilotUserId) ?? "Unknown pilot",
                p.LegSequence,
                legCounts.GetValueOrDefault(p.BookingId, p.LegSequence),
                airports[p.OriginAirportId],
                airports[p.DestinationAirportId],
                types[p.AircraftTypeId],
                p.DistanceNm,
                Utc(p.DepartedAtUtc),
                Utc(p.ArrivedAtUtc),
                p.FlightMinutes,
                p.FuelUsedKg,
                p.LandingRateFpm,
                p.Remarks,
                p.Status.ToString(),
                p.Flag,
                p.ReviewNote,
                Utc(p.FiledAtUtc),
                p.ReviewedAtUtc is { } reviewed ? Utc(reviewed) : null))
            .ToList();
    }

    private static DateTime Utc(DateTime value) => DateTime.SpecifyKind(value, DateTimeKind.Utc);
}