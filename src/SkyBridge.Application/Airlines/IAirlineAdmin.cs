using SkyBridge.Application.Common;

namespace SkyBridge.Application.Airlines;

public interface IAirlineAdmin
{
    Task<Result<AirlineDetailResponse>> CreateAsync(AirlineRequest request, CancellationToken cancellationToken);
    Task<Result<AirlineDetailResponse>> UpdateAsync(int id, AirlineRequest request, CancellationToken cancellationToken);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<Result<AirlineDetailResponse>> SetFleetAsync(int id, FleetRequest request, CancellationToken cancellationToken);
    Task<Result<RouteResponse>> AddRouteAsync(int airlineId, RouteRequest request, CancellationToken cancellationToken);
    Task<Result<bool>> DeleteRouteAsync(int airlineId, int routeId, CancellationToken cancellationToken);
}