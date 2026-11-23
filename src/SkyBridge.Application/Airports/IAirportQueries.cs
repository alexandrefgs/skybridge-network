using SkyBridge.Application.Common;

namespace SkyBridge.Application.Airports;

public interface IAirportQueries
{
    Task<PagedResult<AirportResponse>> SearchAsync(AirportSearch search, CancellationToken cancellationToken);
    Task<AirportResponse?> GetAsync(string ident, CancellationToken cancellationToken);
    Task<IReadOnlyList<RunwayResponse>?> GetRunwaysAsync(string ident, CancellationToken cancellationToken);
}