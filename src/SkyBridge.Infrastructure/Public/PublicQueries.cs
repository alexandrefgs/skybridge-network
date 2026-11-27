using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Public;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.Freelance;
using SkyBridge.Domain.Pireps;
using SkyBridge.Infrastructure.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Public;

internal sealed class PublicQueries(SkyBridgeDbContext db, IOnlineNetworks networks, TimeProvider time) : IPublicQueries
{
    public const int MaxRecentFlights = 12;

    public async Task<PublicStatsResponse> GetStatsAsync(CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow().UtcDateTime;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var accepted = db.Pireps.AsNoTracking().Where(p => p.Status == PirepStatus.Accepted);

        var totalFlights = await accepted.CountAsync(cancellationToken);
        var monthFlights = await accepted.CountAsync(p => p.ArrivedAtUtc >= monthStart, cancellationToken);
        var aircraft = await db.AircraftTypes.CountAsync(cancellationToken);
        var pilots = await db.Pilots.CountAsync(cancellationToken);
        var airlines = await db.Airlines.CountAsync(a => a.IsActive, cancellationToken);

        var activeRoutes = db.Routes.AsNoTracking().Where(r => db.Airlines.Any(a => a.Id == r.AirlineId && a.IsActive));
        var destinations = await activeRoutes.Select(r => r.OriginAirportId)
            .Union(activeRoutes.Select(r => r.DestinationAirportId))
            .CountAsync(cancellationToken);

        var linked = await db.Pilots.AsNoTracking()
            .Where(p => p.VatsimId != null || p.IvaoId != null)
            .Select(p => new { p.VatsimId, p.IvaoId })
            .ToListAsync(cancellationToken);
        var online = await networks.GetOnlinePilotsAsync(cancellationToken);

        return new PublicStatsResponse(
            totalFlights,
            monthFlights,
            online.Vatsim is { } vatsim ? linked.Count(p => p.VatsimId is { } id && vatsim.Contains(id)) : null,
            online.Ivao is { } ivao ? linked.Count(p => p.IvaoId is { } id && ivao.Contains(id)) : null,
            aircraft,
            destinations,
            pilots,
            airlines);
    }

    public async Task<IReadOnlyList<PublicFlightResponse>> GetRecentFlightsAsync(int count, CancellationToken cancellationToken)
    {
        count = Math.Clamp(count, 1, MaxRecentFlights);

        var pireps = await db.Pireps.AsNoTracking()
            .Where(p => p.Status == PirepStatus.Accepted)
            .OrderByDescending(p => p.ArrivedAtUtc)
            .ThenByDescending(p => p.Id)
            .Take(count)
            .ToListAsync(cancellationToken);
        if (pireps.Count == 0)
            return [];

        var airportIds = pireps.SelectMany(p => new[] { p.OriginAirportId, p.DestinationAirportId }).Distinct().ToList();
        var airports = await db.Airports.AsNoTracking().Where(a => airportIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id, cancellationToken);
        var typeIds = pireps.Select(p => p.AircraftTypeId).Distinct().ToList();
        var types = await db.AircraftTypes.AsNoTracking().Where(t => typeIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id, cancellationToken);
        var bookingIds = pireps.Select(p => p.BookingId).Distinct().ToList();
        var bookings = await db.Bookings.AsNoTracking().Where(b => bookingIds.Contains(b.Id)).ToDictionaryAsync(b => b.Id, cancellationToken);
        var jobIds = bookings.Values.Where(b => b.FreelanceJobId != null).Select(b => b.FreelanceJobId!.Value).Distinct().ToList();
        var missions = await db.Set<FreelanceJob>().AsNoTracking().Where(j => jobIds.Contains(j.Id)).ToDictionaryAsync(j => j.Id, j => j.Kind, cancellationToken);
        var userIds = pireps.Select(p => p.PilotUserId).Distinct().ToList();
        var pilots = await db.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => ShortName(u.FirstName, u.LastName), cancellationToken);

        return pireps.Select(p =>
            {
                var booking = bookings.GetValueOrDefault(p.BookingId);
                var origin = airports[p.OriginAirportId];
                var destination = airports[p.DestinationAirportId];
                var type = types[p.AircraftTypeId];
                var mission = booking?.Source != BookingSource.Freelance ? null
                : booking.FreelanceJobId is { } jobId && missions.TryGetValue(jobId, out var kind) ? kind.ToString() : "Freelance";
                return new PublicFlightResponse(
                    p.Id,
                    booking?.Source == BookingSource.Airline ? booking.FlightNumber : null,
                    booking?.Source == BookingSource.Airline ? booking.AirlineName : null,
                    mission,
                    AirportCodes.Display(origin),
                    origin.Name,
                    AirportCodes.Display(destination),
                    destination.Name,
                    type.IcaoCode,
                    $"{type.Manufacturer} {type.Model}",
                    pilots.GetValueOrDefault(p.PilotUserId) ?? "SkyBridge pilot",
                    p.FlightMinutes,
                    p.LandingRateFpm,
                    DateTime.SpecifyKind(p.ArrivedAtUtc, DateTimeKind.Utc));
            })
            .ToList();
    }

    public static string ShortName(string firstName, string lastName)
    {
        var first = firstName.Trim();
        var last = lastName.Trim();
        if (first.Length == 0)
            return last.Length == 0 ? "SkyBridge pilot" : last;
        return last.Length == 0 ? first : $"{first} {char.ToUpperInvariant(last[0])}.";
    }
}