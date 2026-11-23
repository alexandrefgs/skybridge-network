using SkyBridge.Application.Common;

namespace SkyBridge.Application.Pilots;

public interface IPilotService
{
    Task<PilotResponse> GetAsync(Guid userId, CancellationToken cancellationToken);
    Task<Result<PilotResponse>> JumpseatAsync(Guid userId, JumpseatRequest request, CancellationToken cancellationToken);
    Task<PagedResult<PilotTransactionResponse>> GetTransactionsAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken);
}