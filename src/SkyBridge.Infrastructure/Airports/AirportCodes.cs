using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Airports;

internal static class AirportCodes
{
    public static string Normalize(string value) => value.Trim().ToUpperInvariant();

    public static string Display(Airport airport) => airport.IcaoCode ?? airport.Ident;

    public static async Task<Dictionary<string, Airport>> FindAsync(SkyBridgeDbContext db, IEnumerable<string> codes, CancellationToken cancellationToken)
    {
        var wanted = codes.Select(Normalize).Distinct().ToList();
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
}