using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Airports;
using SkyBridge.Application.Common;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Airports;

internal sealed class AirportQueries(SkyBridgeDbContext db) : IAirportQueries
{
    private const int MaxPageSize = 100;

    public async Task<PagedResult<AirportResponse>> SearchAsync(AirportSearch search, CancellationToken cancellationToken)
    {
        var page = Math.Max(search.Page, 1);
        var pageSize = Math.Clamp(search.PageSize, 1, MaxPageSize);
        var term = string.IsNullOrWhiteSpace(search.Query) ? null : search.Query.Trim();
        var country = string.IsNullOrWhiteSpace(search.Country) ? null : search.Country.Trim().ToUpperInvariant();

        var query = db.Airports.AsNoTracking();

        if (term is not null)
        {
            query = query.Where(a =>
                a.Ident == term || a.IcaoCode == term || a.IataCode == term ||
                a.Name.Contains(term) || (a.Municipality != null && a.Municipality.Contains(term)));
        }

        if (country is not null)
            query = query.Where(a => a.CountryCode == country);

        var total = await query.CountAsync(cancellationToken);

        var ordered = term is null
            ? query.OrderByDescending(a => a.Type)
            : query.OrderByDescending(a => a.Ident == term || a.IcaoCode == term || a.IataCode == term).ThenByDescending(a => a.Type);

        var airports = await ordered
            .ThenBy(a => a.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<AirportResponse>(airports.Select(AirportResponse.From).ToList(), page, pageSize, total);
    }

    public async Task<AirportResponse?> GetAsync(string ident, CancellationToken cancellationToken)
    {
        var value = ident.Trim();
        var airport = await db.Airports.AsNoTracking().FirstOrDefaultAsync(a => a.Ident == value, cancellationToken);
        return airport is null ? null : AirportResponse.From(airport);
    }
}