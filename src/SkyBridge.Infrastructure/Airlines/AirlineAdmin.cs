using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Common;
using SkyBridge.Domain.Airlines;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Routes;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Airlines;

internal sealed class AirlineAdmin(SkyBridgeDbContext db, IAirlineQueries queries, IRplSource rplSource, TimeProvider time) : IAirlineAdmin
{
    private const int MaxIssues = 100;

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

        var airports = await FindAirportsAsync([request.Origin, request.Destination], cancellationToken);

        if (!airports.TryGetValue(Code(request.Origin), out var origin))
            return Result<RouteResponse>.Invalid(nameof(request.Origin), $"Airport '{Code(request.Origin)}' was not found.");

        if (!airports.TryGetValue(Code(request.Destination), out var destination))
            return Result<RouteResponse>.Invalid(nameof(request.Destination), $"Airport '{Code(request.Destination)}' was not found.");

        if (origin.Id == destination.Id)
            return Result<RouteResponse>.Invalid(nameof(request.Destination), "Origin and destination must be different airports.");

        if (await db.Routes.AnyAsync(r => r.AirlineId == airlineId && r.OriginAirportId == origin.Id && r.DestinationAirportId == destination.Id, cancellationToken))
            return Result<RouteResponse>.Conflict(nameof(request.Destination), $"Route {DisplayCode(origin)}-{DisplayCode(destination)} already exists.");

        var types = await ResolveAircraftAsync(request.Aircraft, cancellationToken);
        if (types.Unknown.Count > 0)
            return Result<RouteResponse>.Invalid(nameof(request.Aircraft), $"Unknown aircraft type: {string.Join(", ", types.Unknown)}.");

        var route = Route.Create(airlineId, origin, destination);
        route.SetDetails(request.AtsRoute, request.FlightLevel);
        route.SetAircraft(types.Ids);
        db.Routes.Add(route);
        await db.SaveChangesAsync(cancellationToken);

        return Result<RouteResponse>.Ok((await queries.GetRouteAsync(airlineId, route.Id, cancellationToken))!);
    }

    public async Task<Result<RouteResponse>> UpdateRouteAsync(int airlineId, int routeId, RouteDetailsRequest request, CancellationToken cancellationToken)
    {
        var route = await db.Routes.Include(r => r.Aircraft)
            .FirstOrDefaultAsync(r => r.Id == routeId && r.AirlineId == airlineId, cancellationToken);
        if (route is null)
            return Result<RouteResponse>.NotFound();

        var types = await ResolveAircraftAsync(request.Aircraft, cancellationToken);
        if (types.Unknown.Count > 0)
            return Result<RouteResponse>.Invalid(nameof(request.Aircraft), $"Unknown aircraft type: {string.Join(", ", types.Unknown)}.");

        route.SetDetails(request.AtsRoute, request.FlightLevel);
        route.SetAircraft(types.Ids);
        await db.SaveChangesAsync(cancellationToken);

        return Result<RouteResponse>.Ok((await queries.GetRouteAsync(airlineId, routeId, cancellationToken))!);
    }

    public async Task<Result<bool>> DeleteRouteAsync(int airlineId, int routeId, CancellationToken cancellationToken)
    {
        var deleted = await db.Routes
            .Where(r => r.Id == routeId && r.AirlineId == airlineId)
            .ExecuteDeleteAsync(cancellationToken);

        return deleted == 0 ? Result<bool>.NotFound() : Result<bool>.Ok(true);
    }

    public async Task<Result<int>> DeleteAllRoutesAsync(int airlineId, CancellationToken cancellationToken)
    {
        if (!await db.Airlines.AnyAsync(a => a.Id == airlineId, cancellationToken))
            return Result<int>.NotFound();

        var deleted = await db.Routes.Where(r => r.AirlineId == airlineId).ExecuteDeleteAsync(cancellationToken);
        return Result<int>.Ok(deleted);
    }

    public async Task<Result<RouteImportResult>> ImportRoutesAsync(int airlineId, Stream file, CancellationToken cancellationToken)
    {
        var airline = await db.Airlines.Include(a => a.Fleet).FirstOrDefaultAsync(a => a.Id == airlineId, cancellationToken);
        if (airline is null)
            return Result<RouteImportResult>.NotFound();

        var routeFile = RouteFileReader.Read(file);
        return await ImportAsync(airline, routeFile, routeFile.Format == RouteFileFormat.Rpl ? "RPL file" : "CSV file", cancellationToken);
    }

    public async Task<Result<RouteImportResult>> SyncRoutesFromCgnaAsync(int airlineId, CancellationToken cancellationToken)
    {
        var airline = await db.Airlines.Include(a => a.Fleet).FirstOrDefaultAsync(a => a.Id == airlineId, cancellationToken);
        if (airline is null)
            return Result<RouteImportResult>.NotFound();

        if (airline.IcaoCode is null)
            return Result<RouteImportResult>.Invalid("airline", "The airline needs an ICAO code to sync from CGNA.");

        var download = await rplSource.DownloadAsync(airline.IcaoCode, cancellationToken);
        if (download is null)
            return Result<RouteImportResult>.Invalid("airline", $"CGNA has no current RPL for {airline.IcaoCode}.");

        await using var content = download.Content;
        return await ImportAsync(airline, RouteFileReader.Read(content), "CGNA", cancellationToken);
    }

    private async Task<Result<RouteImportResult>> ImportAsync(Airline airline, RouteFile file, string source, CancellationToken cancellationToken)
    {
        if (file.Format == RouteFileFormat.Rpl && file.AirlineCode != airline.IcaoCode)
            return Result<RouteImportResult>.Invalid("file", $"This RPL belongs to {file.AirlineCode}, not to {airline.IcaoCode ?? airline.Name}.");

        if (file.Rows.Count == 0)
            return Result<RouteImportResult>.Invalid("file", file.Issues.FirstOrDefault()?.Message ?? "The file has no routes.");

        var issues = file.Issues.ToList();
        var airports = await FindAirportsAsync(file.Rows.SelectMany(r => new[] { r.Origin, r.Destination }), cancellationToken);
        var catalog = await db.AircraftTypes.AsNoTracking()
            .Select(t => new { t.Id, t.IcaoCode })
            .ToDictionaryAsync(t => t.IcaoCode, t => t.Id, cancellationToken);

        var existing = await db.Routes.Include(r => r.Aircraft)
            .Where(r => r.AirlineId == airline.Id)
            .ToDictionaryAsync(r => (r.OriginAirportId, r.DestinationAirportId), cancellationToken);

        int added = 0, updated = 0, unchanged = 0, skipped = 0;
        var usedTypes = new HashSet<int>();

        foreach (var row in file.Rows)
        {
            if (!airports.TryGetValue(row.Origin, out var origin) || !airports.TryGetValue(row.Destination, out var destination))
            {
                var missing = airports.ContainsKey(row.Origin) ? row.Destination : row.Origin;
                issues.Add(new RouteImportIssue(row.Line, $"Airport {missing} was not found, {row.Origin}-{row.Destination} skipped."));
                skipped++;
                continue;
            }

            if (origin.Id == destination.Id)
            {
                issues.Add(new RouteImportIssue(row.Line, "Origin and destination are the same airport, line skipped."));
                skipped++;
                continue;
            }

            var typeIds = new List<int>();
            foreach (var code in row.Aircraft)
            {
                if (catalog.TryGetValue(code, out var typeId))
                    typeIds.Add(typeId);
                else
                    issues.Add(new RouteImportIssue(row.Line, $"Aircraft type {code} is not in the catalog, ignored."));
            }
            usedTypes.UnionWith(typeIds);

            var atsRoute = Route.NormalizeAtsRoute(row.AtsRoute);
            if (atsRoute is { Length: > Route.MaxAtsRouteLength })
            {
                issues.Add(new RouteImportIssue(row.Line, "Route text is too long, ignored."));
                atsRoute = null;
            }

            if (existing.TryGetValue((origin.Id, destination.Id), out var route))
            {
                var changed = route.SetDetails(atsRoute ?? route.AtsRoute, row.FlightLevel ?? route.FlightLevel);
                if (typeIds.Count > 0)
                    changed |= route.SetAircraft(typeIds);

                if (changed) updated++; else unchanged++;
                continue;
            }

            route = Route.Create(airline.Id, origin, destination);
            route.SetDetails(atsRoute, row.FlightLevel);
            route.SetAircraft(typeIds);
            db.Routes.Add(route);
            existing[(origin.Id, destination.Id)] = route;
            added++;
        }

        var fleet = airline.Fleet.Select(f => f.AircraftTypeId).ToHashSet();
        var newTypes = usedTypes.Except(fleet).ToList();
        if (newTypes.Count > 0)
            airline.SetFleet(fleet.Concat(newTypes));

        airline.MarkRoutesUpdated(source, file.Edition, time.GetUtcNow());
        await db.SaveChangesAsync(cancellationToken);

        var fleetAdded = catalog.Where(t => newTypes.Contains(t.Value)).Select(t => t.Key).Order(StringComparer.Ordinal).ToList();
        var shownIssues = issues
            .GroupBy(i => i.Message)
            .Select(g => g.First())
            .OrderBy(i => i.Line)
            .Take(MaxIssues)
            .ToList();

        return Result<RouteImportResult>.Ok(new RouteImportResult(
            file.Format.ToString().ToUpperInvariant(), file.Edition, added, updated, unchanged, skipped, fleetAdded, shownIssues));
    }

    private async Task<Dictionary<string, Airport>> FindAirportsAsync(IEnumerable<string> codes, CancellationToken cancellationToken)
    {
        var wanted = codes.Select(Code).Distinct().ToList();
        var airports = await db.Airports.AsNoTracking()
            .Where(a => wanted.Contains(a.Ident) || (a.IcaoCode != null && wanted.Contains(a.IcaoCode)))
            .ToListAsync(cancellationToken);

        var result = new Dictionary<string, Airport>(StringComparer.OrdinalIgnoreCase);
        foreach (var airport in airports.Where(a => a.IcaoCode != null))
            result.TryAdd(airport.IcaoCode!, airport);
        foreach (var airport in airports)
            result.TryAdd(airport.Ident, airport);
        return result;
    }

    private async Task<(List<int> Ids, List<string> Unknown)> ResolveAircraftAsync(IReadOnlyList<string>? codes, CancellationToken cancellationToken)
    {
        var wanted = (codes ?? [])
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(Code)
            .Distinct()
            .ToList();

        var types = await db.AircraftTypes.AsNoTracking()
            .Where(t => wanted.Contains(t.IcaoCode))
            .Select(t => new { t.Id, t.IcaoCode })
            .ToListAsync(cancellationToken);

        return (types.Select(t => t.Id).ToList(), wanted.Except(types.Select(t => t.IcaoCode)).ToList());
    }

    private static string Code(string value) => value.Trim().ToUpperInvariant();

    private static string DisplayCode(Airport airport) => airport.IcaoCode ?? airport.Ident;

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