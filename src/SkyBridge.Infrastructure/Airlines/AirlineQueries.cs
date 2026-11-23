using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Common;
using SkyBridge.Domain.Airlines;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Routes;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Airlines;

internal sealed class AirlineQueries(SkyBridgeDbContext db) : IAirlineQueries
{
    private const int MaxPageSize = 100;

    public async Task<PagedResult<AirlineResponse>> SearchAsync(AirlineSearch search, CancellationToken cancellationToken)
    {
        var page = Math.Max(search.Page, 1);
        var pageSize = Math.Clamp(search.PageSize, 1, MaxPageSize);
        var term = string.IsNullOrWhiteSpace(search.Query) ? null : search.Query.Trim();

        var query = db.Airlines.AsNoTracking();

        if (search.Active is not null)
            query = query.Where(a => a.IsActive == search.Active.Value);

        if (term is not null)
        {
            query = query.Where(a =>
                a.IataCode == term || a.IcaoCode == term ||
                a.Name.Contains(term) || (a.Callsign != null && a.Callsign.Contains(term)) ||
                (a.Country != null && a.Country.Contains(term)));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .Select(a => new { Airline = a, RouteCount = db.Routes.Count(r => r.AirlineId == a.Id) })
            .OrderByDescending(x => term != null && (x.Airline.IataCode == term || x.Airline.IcaoCode == term))
            .ThenByDescending(x => x.Airline.IsActive)
            .ThenByDescending(x => x.RouteCount)
            .ThenBy(x => x.Airline.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AirlineResponse(x.Airline.Id, x.Airline.Name, x.Airline.IataCode, x.Airline.IcaoCode,
                x.Airline.Callsign, x.Airline.Country, x.Airline.IsActive, x.RouteCount))
            .ToListAsync(cancellationToken);

        return new PagedResult<AirlineResponse>(items, page, pageSize, total);
    }

    public async Task<AirlineDetailResponse?> GetAsync(int id, CancellationToken cancellationToken)
    {
        var airline = await db.Airlines.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (airline is null)
            return null;

        var routeCount = await db.Routes.CountAsync(r => r.AirlineId == id, cancellationToken);

        var fleet = await db.Set<AirlineAircraft>().AsNoTracking()
            .Where(f => f.AirlineId == id)
            .Join(db.AircraftTypes, f => f.AircraftTypeId, t => t.Id, (f, t) => t)
            .OrderBy(t => t.Category)
            .ThenBy(t => t.Manufacturer)
            .ThenBy(t => t.Model)
            .ToListAsync(cancellationToken);

        return new AirlineDetailResponse(airline.Id, airline.Name, airline.IataCode, airline.IcaoCode, airline.Callsign,
            airline.Country, airline.IsActive, routeCount,
            fleet.Select(t => new FleetTypeResponse(t.IcaoCode, t.Manufacturer, t.Model, t.Category.ToString())).ToList(),
            airline.RoutesUpdatedAtUtc, airline.RoutesSource, airline.RoutesEdition);
    }

        public async Task<PagedResult<RouteResponse>?> GetRoutesAsync(int airlineId, RouteSearch search, CancellationToken cancellationToken)
    {
        if (!await db.Airlines.AnyAsync(a => a.Id == airlineId, cancellationToken))
            return null;

        var page = Math.Max(search.Page, 1);
        var pageSize = Math.Clamp(search.PageSize, 1, MaxPageSize);
        var term = string.IsNullOrWhiteSpace(search.Query) ? null : search.Query.Trim();

        var query = RouteRows(airlineId);

        if (term is not null)
        {
            query = query.Where(r =>
                r.Origin.Ident == term || r.Origin.IcaoCode == term || r.Origin.IataCode == term ||
                r.Destination.Ident == term || r.Destination.IcaoCode == term || r.Destination.IataCode == term ||
                r.Origin.Name.Contains(term) || r.Destination.Name.Contains(term) ||
                (r.Origin.Municipality != null && r.Origin.Municipality.Contains(term)) ||
                (r.Destination.Municipality != null && r.Destination.Municipality.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(search.From))
        {
            var from = search.From.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(search.To))
            {
                query = query.Where(r => (r.Origin.IcaoCode ?? r.Origin.Ident) == from);
            }
            else
            {
                var to = search.To.Trim().ToUpperInvariant();
                query = query.Where(r =>
                    ((r.Origin.IcaoCode ?? r.Origin.Ident) == from && (r.Destination.IcaoCode ?? r.Destination.Ident) == to) ||
                    ((r.Origin.IcaoCode ?? r.Origin.Ident) == to && (r.Destination.IcaoCode ?? r.Destination.Ident) == from));
            }
        }

        var total = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderBy(r => r.Origin.IcaoCode ?? r.Origin.Ident)
            .ThenBy(r => r.Destination.IcaoCode ?? r.Destination.Ident)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<RouteResponse>(await ToResponsesAsync(rows, cancellationToken), page, pageSize, total);
    }

    public async Task<RouteResponse?> GetRouteAsync(int airlineId, int routeId, CancellationToken cancellationToken)
    {
        var row = await RouteRows(airlineId).FirstOrDefaultAsync(r => r.Route.Id == routeId, cancellationToken);
        return row is null ? null : (await ToResponsesAsync([row], cancellationToken))[0];
    }

    public async Task<RouteNetworkResponse?> GetNetworkAsync(int airlineId, CancellationToken cancellationToken)
    {
        if (!await db.Airlines.AnyAsync(a => a.Id == airlineId, cancellationToken))
            return null;

        var pairs = await db.Routes.AsNoTracking()
            .Where(r => r.AirlineId == airlineId)
            .Select(r => new { r.OriginAirportId, r.DestinationAirportId })
            .ToListAsync(cancellationToken);

        var ids = pairs.SelectMany(p => new[] { p.OriginAirportId, p.DestinationAirportId }).Distinct().ToList();
        var airports = await db.Airports.AsNoTracking()
            .Where(a => ids.Contains(a.Id))
            .Select(a => new { a.Id, Code = a.IcaoCode ?? a.Ident, a.IataCode, a.Name, a.Latitude, a.Longitude })
            .OrderBy(a => a.Code)
            .ToListAsync(cancellationToken);

        var index = airports.Select((airport, position) => (airport.Id, position)).ToDictionary(x => x.Id, x => x.position);
        var links = pairs
            .Select(p => (From: index[p.OriginAirportId], To: index[p.DestinationAirportId]))
            .Distinct()
            .OrderBy(l => l.From)
            .ThenBy(l => l.To)
            .Select(l => new[] { l.From, l.To })
            .ToList();

        return new RouteNetworkResponse(
            airports.Select(a => new NetworkAirport(a.Code, a.IataCode, a.Name, a.Latitude, a.Longitude)).ToList(),
            links);
    }

    private IQueryable<RouteRow> RouteRows(int airlineId) =>
        from route in db.Routes.AsNoTracking()
        where route.AirlineId == airlineId
        join origin in db.Airports on route.OriginAirportId equals origin.Id
        join destination in db.Airports on route.DestinationAirportId equals destination.Id
        select new RouteRow { Route = route, Origin = origin, Destination = destination };

    private async Task<List<RouteResponse>> ToResponsesAsync(List<RouteRow> rows, CancellationToken cancellationToken)
    {
        var ids = rows.Select(r => r.Route.Id).ToList();
        var aircraft = (await db.Set<RouteAircraft>().AsNoTracking()
                .Where(a => ids.Contains(a.RouteId))
                .Join(db.AircraftTypes, a => a.AircraftTypeId, t => t.Id, (a, t) => new { a.RouteId, t.IcaoCode })
                .ToListAsync(cancellationToken))
            .GroupBy(a => a.RouteId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<string>)g.Select(a => a.IcaoCode).Order(StringComparer.Ordinal).ToList());

        return rows.Select(r => new RouteResponse(
                r.Route.Id,
                r.Origin.IcaoCode ?? r.Origin.Ident, r.Origin.IataCode, r.Origin.Name,
                r.Destination.IcaoCode ?? r.Destination.Ident, r.Destination.IataCode, r.Destination.Name,
                r.Route.DistanceNm,
                aircraft.GetValueOrDefault(r.Route.Id, []),
                r.Route.AtsRoute,
                r.Route.FlightLevel))
            .ToList();
    }

    private sealed class RouteRow
    {
        public required Route Route { get; init; }
        public required Airport Origin { get; init; }
        public required Airport Destination { get; init; }
    }
}