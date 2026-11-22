namespace SkyBridge.Application.Auth;

public interface IAuthService
{
    Task<AuthResult<LoginResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<AuthResult<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<AuthResult<LoginResponse>> LoginWithTwoFactorAsync(TwoFactorLoginRequest request, CancellationToken cancellationToken);
    Task<CurrentUserResponse?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken);
}