using SkyBridge.Application.Common;

namespace SkyBridge.Application.Airlines;

public interface IAirlineQueries
{
    Task<PagedResult<AirlineResponse>> SearchAsync(AirlineSearch search, CancellationToken cancellationToken);
    Task<AirlineDetailResponse?> GetAsync(int id, CancellationToken cancellationToken);
    Task<PagedResult<RouteResponse>?> GetRoutesAsync(int airlineId, RouteSearch search, CancellationToken cancellationToken);
}