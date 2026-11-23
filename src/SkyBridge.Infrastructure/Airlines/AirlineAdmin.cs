using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Common;
using SkyBridge.Domain.Airlines;
using SkyBridge.Domain.Routes;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Airlines;

internal sealed class AirlineAdmin(SkyBridgeDbContext db, IAirlineQueries queries) : IAirlineAdmin
{
    public async Task<Result<AirlineDetailResponse>> CreateAsync(AirlineRequest request, CancellationToken cancellationToken)
    {
        var conflict = await IcaoConflictAsync(null, request, cancellationToken);
        if (conflict is not null)
            return conflict;

        var airline = Airline.Create(request.ToData());
        db.Airlines.Add(airline);
        await db.SaveChangesAsync(cancellationToken);
        return await DetailAsync(airline.Id, cancellationToken);
    }

    public async Task<Result<AirlineDetailResponse>> UpdateAsync(int id, AirlineRequest request, CancellationToken cancellationToken)
    {
        var airline = await db.Airlines.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (airline is null)
            return Result<AirlineDetailResponse>.NotFound();

        var conflict = await IcaoConflictAsync(id, request, cancellationToken);
        if (conflict is not null)
            return conflict;

        airline.Apply(request.ToData());
        await db.SaveChangesAsync(cancellationToken);
        return await DetailAsync(id, cancellationToken);
    }

    public async Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var airline = await db.Airlines.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (airline is null)
            return Result<bool>.NotFound();

        db.Airlines.Remove(airline);
        await db.SaveChangesAsync(cancellationToken);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<AirlineDetailResponse>> SetFleetAsync(int id, FleetRequest request, CancellationToken cancellationToken)
    {
        var airline = await db.Airlines.Include(a => a.Fleet).FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (airline is null)
            return Result<AirlineDetailResponse>.NotFound();

        var codes = request.AircraftTypes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code.Trim().ToUpperInvariant())
            .Distinct()
            .ToList();

        var types = await db.AircraftTypes
            .Where(t => codes.Contains(t.IcaoCode))
            .Select(t => new { t.Id, t.IcaoCode })
            .ToListAsync(cancellationToken);

        var unknown = codes.Except(types.Select(t => t.IcaoCode)).ToList();
        if (unknown.Count > 0)
            return Result<AirlineDetailResponse>.Invalid(nameof(request.AircraftTypes), $"Unknown aircraft type: {string.Join(", ", unknown)}.");

        airline.SetFleet(types.Select(t => t.Id));
        await db.SaveChangesAsync(cancellationToken);
        return await DetailAsync(id, cancellationToken);
    }

    public async Task<Result<RouteResponse>> AddRouteAsync(int airlineId, RouteRequest request, CancellationToken cancellationToken)
    {
        if (!await db.Airlines.AnyAsync(a => a.Id == airlineId, cancellationToken))
            return Result<RouteResponse>.NotFound();

        var originCode = request.Origin.Trim().ToUpperInvariant();
        var destinationCode = request.Destination.Trim().ToUpperInvariant();

        var origin = await db.Airports.AsNoTracking().FirstOrDefaultAsync(a => a.Ident == originCode, cancellationToken);
        if (origin is null)
            return Result<RouteResponse>.Invalid(nameof(request.Origin), $"Airport '{originCode}' was not found.");

        var destination = await db.Airports.AsNoTracking().FirstOrDefaultAsync(a => a.Ident == destinationCode, cancellationToken);
        if (destination is null)
            return Result<RouteResponse>.Invalid(nameof(request.Destination), $"Airport '{destinationCode}' was not found.");

        if (origin.Id == destination.Id)
            return Result<RouteResponse>.Invalid(nameof(request.Destination), "Origin and destination must be different airports.");

        if (await db.Routes.AnyAsync(r => r.AirlineId == airlineId && r.OriginAirportId == origin.Id && r.DestinationAirportId == destination.Id, cancellationToken))
            return Result<RouteResponse>.Conflict(nameof(request.Destination), $"Route {origin.Ident}-{destination.Ident} already exists.");

        var route = Route.Create(airlineId, origin, destination);
        db.Routes.Add(route);
        await db.SaveChangesAsync(cancellationToken);

        return Result<RouteResponse>.Ok(new RouteResponse(route.Id, origin.Ident, origin.IataCode, origin.Name,
            destination.Ident, destination.IataCode, destination.Name, route.DistanceNm));
    }

    public async Task<Result<bool>> DeleteRouteAsync(int airlineId, int routeId, CancellationToken cancellationToken)
    {
        var deleted = await db.Routes
            .Where(r => r.Id == routeId && r.AirlineId == airlineId)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted == 0 ? Result<bool>.NotFound() : Result<bool>.Ok(true);
    }

    private async Task<Result<AirlineDetailResponse>?> IcaoConflictAsync(int? id, AirlineRequest request, CancellationToken cancellationToken)
    {
        var icao = request.IcaoCode?.Trim().ToUpperInvariant();
        if (!request.IsActive || string.IsNullOrEmpty(icao))
            return null;

        var taken = await db.Airlines.AnyAsync(a => a.Id != id && a.IsActive && a.IcaoCode == icao, cancellationToken);
        return taken
            ? Result<AirlineDetailResponse>.Conflict(nameof(request.IcaoCode), $"An active airline already uses the ICAO code '{icao}'.")
            : null;
    }

    private async Task<Result<AirlineDetailResponse>> DetailAsync(int id, CancellationToken cancellationToken) =>
        Result<AirlineDetailResponse>.Ok((await queries.GetAsync(id, cancellationToken))!);
}