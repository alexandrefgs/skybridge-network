using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SkyBridge.Application.Airports;
using SkyBridge.Domain.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Airports;

internal sealed class AirportImporter(SkyBridgeDbContext db, ILogger<AirportImporter> logger) : IAirportImporter
{
    private const int BatchSize = 2000;

    public async Task<AirportImportResult> ImportAsync(Stream csv, CancellationToken cancellationToken)
    {
        var existing = await db.Airports.ToDictionaryAsync(a => a.Ident, StringComparer.OrdinalIgnoreCase, cancellationToken);
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        int added = 0, updated = 0, unchanged = 0, pending = 0;

        foreach (var data in OurAirportsCsvReader.Read(csv))
        {
            if (!seen.Add(data.Ident))
                continue;

            if (existing.TryGetValue(data.Ident, out var airport))
            {
                if (airport.Apply(data))
                {
                    updated++;
                    pending++;
                }
                else
                {
                    unchanged++;
                }
            }
            else
            {
                db.Airports.Add(Airport.Create(data));
                added++;
                pending++;
            }

            if (pending >= BatchSize)
            {
                await db.SaveChangesAsync(cancellationToken);
                pending = 0;
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        var result = new AirportImportResult(added, updated, unchanged, seen.Count);
        logger.LogInformation("Airport import finished: {Added} added, {Updated} updated, {Unchanged} unchanged", added, updated, unchanged);
        return result;
    }
}