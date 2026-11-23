using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SkyBridge.Application.Airlines;
using SkyBridge.Domain.Airlines;
using SkyBridge.Domain.Routes;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Airlines;

internal sealed class AirlineImporter(SkyBridgeDbContext db, ILogger<AirlineImporter> logger) : IAirlineImporter
{
    private const int BatchSize = 2000;

    public async Task<AirlineImportResult> ImportAsync(Stream airlines, Stream routes, CancellationToken cancellationToken)
    {
        var (airlinesAdded, airlinesUpdated) = await ImportAirlinesAsync(airlines, cancellationToken);
        var (routesAdded, routesSkipped) = await ImportRoutesAsync(routes, cancellationToken);

        logger.LogInformation(
            "Airline import finished: {AirlinesAdded} airlines added, {AirlinesUpdated} updated, {RoutesAdded} routes added, {RoutesSkipped} skipped",
            airlinesAdded, airlinesUpdated, routesAdded, routesSkipped);

        return new AirlineImportResult(airlinesAdded, airlinesUpdated, routesAdded, routesSkipped);
    }

    private async Task<(int Added, int Updated)> ImportAirlinesAsync(Stream stream, CancellationToken cancellationToken)
    {
        var existing = await db.Airlines
            .Where(a => a.SourceId != null)
            .ToDictionaryAsync(a => a.SourceId!.Value, cancellationToken);
        int added = 0, updated = 0;

        foreach (var row in OpenFlightsReader.ReadAirlines(stream))
        {
            if (existing.TryGetValue(row.SourceId, out var airline))
            {
                if (airline.Apply(row.Data))
                    updated++;
            }
            else
            {
                airline = Airline.Create(row.Data, row.SourceId);
                db.Airlines.Add(airline);
                existing[row.SourceId] = airline;
                added++;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        return (added, updated);
    }

    private async Task<(int Added, int Skipped)> ImportRoutesAsync(Stream stream, CancellationToken cancellationToken)
    {
        var airlineIds = await db.Airlines.AsNoTracking()
            .Where(a => a.SourceId != null)
            .ToDictionaryAsync(a => a.SourceId!.Value, a => a.Id, cancellationToken);

        var airports = (await db.Airports.AsNoTracking()
                .Where(a => a.IataCode != null)
                .Select(a => new { a.Id, a.IataCode, a.Latitude, a.Longitude })
                .ToListAsync(cancellationToken))
            .GroupBy(a => a.IataCode!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var known = (await db.Routes.AsNoTracking()
                .Select(r => new { r.AirlineId, r.OriginAirportId, r.DestinationAirportId })
                .ToListAsync(cancellationToken))
            .Select(r => (r.AirlineId, r.OriginAirportId, r.DestinationAirportId))
            .ToHashSet();

        int added = 0, skipped = 0, pending = 0;

        foreach (var row in OpenFlightsReader.ReadRoutes(stream))
        {
            if (!airlineIds.TryGetValue(row.AirlineSourceId, out var airlineId) ||
                !airports.TryGetValue(row.Origin, out var origin) ||
                !airports.TryGetValue(row.Destination, out var destination) ||
                origin.Id == destination.Id)
            {
                skipped++;
                continue;
            }

            if (!known.Add((airlineId, origin.Id, destination.Id)))
                continue;

            db.Routes.Add(Route.Create(airlineId, origin.Id, origin.Latitude, origin.Longitude,
                destination.Id, destination.Latitude, destination.Longitude));
            added++;

            if (++pending >= BatchSize)
            {
                await db.SaveChangesAsync(cancellationToken);
                db.ChangeTracker.Clear();
                pending = 0;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        return (added, skipped);
    }
}