using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Common;
using SkyBridge.Domain.Airlines;
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
            fleet.Select(t => new FleetTypeResponse(t.IcaoCode, t.Manufacturer, t.Model, t.Category.ToString())).ToList());
    }

    public async Task<PagedResult<RouteResponse>?> GetRoutesAsync(int airlineId, RouteSearch search, CancellationToken cancellationToken)
    {
        if (!await db.Airlines.AnyAsync(a => a.Id == airlineId, cancellationToken))
            return null;

        var page = Math.Max(search.Page, 1);
        var pageSize = Math.Clamp(search.PageSize, 1, MaxPageSize);
        var term = string.IsNullOrWhiteSpace(search.Query) ? null : search.Query.Trim();

        var query =
            from route in db.Routes.AsNoTracking()
            where route.AirlineId == airlineId
            join origin in db.Airports on route.OriginAirportId equals origin.Id
            join destination in db.Airports on route.DestinationAirportId equals destination.Id
            select new { route.Id, route.DistanceNm, Origin = origin, Destination = destination };

        if (term is not null)
        {
            query = query.Where(r =>
                r.Origin.Ident == term || r.Origin.IataCode == term || r.Destination.Ident == term || r.Destination.IataCode == term ||
                r.Origin.Name.Contains(term) || r.Destination.Name.Contains(term) ||
                (r.Origin.Municipality != null && r.Origin.Municipality.Contains(term)) ||
                (r.Destination.Municipality != null && r.Destination.Municipality.Contains(term)));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(r => r.Origin.Ident)
            .ThenBy(r => r.Destination.Ident)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RouteResponse(r.Id, r.Origin.Ident, r.Origin.IataCode, r.Origin.Name,
                r.Destination.Ident, r.Destination.IataCode, r.Destination.Name, r.DistanceNm))
            .ToListAsync(cancellationToken);

        return new PagedResult<RouteResponse>(items, page, pageSize, total);
    }
}