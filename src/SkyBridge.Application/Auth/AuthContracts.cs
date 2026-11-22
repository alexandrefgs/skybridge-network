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

public sealed record AuthResponse(string AccessToken, DateTime ExpiresAtUtc);

public sealed record CurrentUserResponse(Guid Id, string Email, string FirstName, string LastName, IReadOnlyList<string> Roles);

public sealed record AuthResult(bool Succeeded, AuthResponse? Response, Dictionary<string, string[]> Errors)
{
    public static AuthResult Success(AuthResponse response) => new(true, response, []);

    public static AuthResult Failure(string code, string message) => new(false, null, new() { [code] = [message] });

    public static AuthResult Failure(Dictionary<string, string[]> errors) => new(false, null, errors);
}