using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SkyBridge.Application.Airports;
using SkyBridge.Domain.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Airports;

internal sealed class RunwayImporter(SkyBridgeDbContext db, ILogger<RunwayImporter> logger) : IRunwayImporter
{
    private const int BatchSize = 2000;

    public async Task<RunwayImportResult> ImportAsync(Stream csv, CancellationToken cancellationToken)
    {
        var byAirport = OurAirportsRunwayReader.Read(csv)
            .GroupBy(r => r.AirportIdent, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Select(r => r.Runway).ToList(), StringComparer.OrdinalIgnoreCase);

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        var airports = await db.Airports.Include(a => a.Runways).OrderBy(a => a.Id).ToListAsync(cancellationToken);
        int added = 0, updated = 0, removed = 0, withRunways = 0, pending = 0;

        foreach (var airport in airports)
        {
            var result = airport.SyncRunways(byAirport.GetValueOrDefault(airport.Ident, []));
            added += result.Added;
            updated += result.Updated;
            removed += result.Removed;
            if (airport.Runways.Count > 0)
                withRunways++;

            if (result.Changed && ++pending >= BatchSize)
            {
                await db.SaveChangesAsync(cancellationToken);
                pending = 0;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation("Runway import finished: {Added} added, {Updated} updated, {Removed} removed, {Airports} airports with runways",
            added, updated, removed, withRunways);
        return new RunwayImportResult(added, updated, removed, withRunways);
    }
}