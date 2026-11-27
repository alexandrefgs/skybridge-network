using System.ComponentModel.DataAnnotations;
using SkyBridge.Application.Common;
using SkyBridge.Application.Legal;
using SkyBridge.Domain.Users;

namespace SkyBridge.Application.Account;

public sealed record AccountStatusResponse(
    AccountStatus Status,
    DateTime? ReactivationReadyAtUtc,
    int? AcceptedRegulationsVersion,
    int CurrentRegulationsVersion,
    IReadOnlyList<RegulationsVersion> PendingRegulations);

public sealed record AcceptRegulationsRequest([Range(1, int.MaxValue)] int Version);

public sealed record DeleteAccountRequest([Required] string Password);

public interface IAccountLifecycle
{
    Task<AccountStatusResponse?> GetStatusAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> IsActiveAsync(Guid userId, CancellationToken cancellationToken);
    Task<Result<AccountStatusResponse>> ReactivateAsync(Guid userId, CancellationToken cancellationToken);
    Task<Result<AccountStatusResponse>> AcceptRegulationsAsync(Guid userId, AcceptRegulationsRequest request, CancellationToken cancellationToken);
    Task<Result<bool>> DeleteAsync(Guid userId, DeleteAccountRequest request, CancellationToken cancellationToken);
    Task<int> PurgeExpiredAsync(CancellationToken cancellationToken);
}