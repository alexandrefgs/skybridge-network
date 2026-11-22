using SkyBridge.Application.Common;
using SkyBridge.Domain.Aircraft;

namespace SkyBridge.Application.Aircraft;

public interface IAircraftCatalog
{
    Task<IReadOnlyList<AircraftCategoryResponse>> GetCategoriesAsync(CancellationToken cancellationToken);
    Task<Result<AircraftCategoryResponse>> UpdateCategoryAsync(AircraftCategoryCode code, UpdateAircraftCategoryRequest request, CancellationToken cancellationToken);
    Task<PagedResult<AircraftTypeResponse>> GetTypesAsync(AircraftTypeSearch search, CancellationToken cancellationToken);
    Task<AircraftTypeResponse?> GetTypeAsync(string icaoCode, CancellationToken cancellationToken);
    Task<Result<AircraftTypeResponse>> CreateTypeAsync(AircraftTypeRequest request, CancellationToken cancellationToken);
    Task<Result<AircraftTypeResponse>> UpdateTypeAsync(string icaoCode, AircraftTypeRequest request, CancellationToken cancellationToken);
    Task<Result<bool>> DeleteTypeAsync(string icaoCode, CancellationToken cancellationToken);
}