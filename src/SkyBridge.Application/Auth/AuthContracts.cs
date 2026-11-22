using System.ComponentModel.DataAnnotations;

namespace SkyBridge.Application.Auth;

public sealed record RegisterRequest(
    [Required, MaxLength(50)] string FirstName,
    [Required, MaxLength(50)] string LastName,
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required] string Password);

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public sealed record TwoFactorLoginRequest(
    [Required] string TwoFactorToken,
    [Required, MaxLength(20)] string Code);

public sealed record TwoFactorCodeRequest([Required, MaxLength(20)] string Code);

public sealed record AuthResponse(string AccessToken, DateTime ExpiresAtUtc);

public sealed record LoginResponse(bool RequiresTwoFactor, string? AccessToken, DateTime? ExpiresAtUtc, string? TwoFactorToken)
{
    public static LoginResponse Authenticated(AuthResponse token) => new(false, token.AccessToken, token.ExpiresAtUtc, null);

    public static LoginResponse TwoFactorRequired(string twoFactorToken) => new(true, null, null, twoFactorToken);
}

public sealed record TwoFactorSetupResponse(string SharedKey, string AuthenticatorUri);

public sealed record RecoveryCodesResponse(IReadOnlyList<string> RecoveryCodes);

public sealed record CurrentUserResponse(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    bool TwoFactorEnabled,
    IReadOnlyList<string> Roles);

public sealed record AuthResult<T>(bool Succeeded, T? Value, Dictionary<string, string[]> Errors)
{
    public static AuthResult<T> Success(T value) => new(true, value, []);

    public static AuthResult<T> Failure(string code, string message) => new(false, default, new() { [code] = [message] });

    public static AuthResult<T> Failure(Dictionary<string, string[]> errors) => new(false, default, errors);
}