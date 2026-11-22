namespace SkyBridge.Application.Auth;

public interface ITwoFactorService
{
    Task<AuthResult<TwoFactorSetupResponse>> SetupAsync(Guid userId, CancellationToken cancellationToken);
    Task<AuthResult<RecoveryCodesResponse>> EnableAsync(Guid userId, string code, CancellationToken cancellationToken);
    Task<AuthResult<bool>> DisableAsync(Guid userId, string code, CancellationToken cancellationToken);
}