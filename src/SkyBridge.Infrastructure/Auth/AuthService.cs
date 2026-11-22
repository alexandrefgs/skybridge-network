using Microsoft.AspNetCore.Identity;
using SkyBridge.Application.Auth;
using SkyBridge.Domain.Users;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Auth;

internal sealed class AuthService(UserManager<ApplicationUser> userManager, JwtTokenService tokens) : IAuthService
{
    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim()
        };

        var created = await userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
            return AuthResult.Failure(ToErrors(created));

        var roleAdded = await userManager.AddToRoleAsync(user, Roles.Pilot);
        if (!roleAdded.Succeeded)
            return AuthResult.Failure(ToErrors(roleAdded));

        return AuthResult.Success(tokens.CreateToken(user, [Roles.Pilot]));
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return InvalidCredentials();

        if (await userManager.IsLockedOutAsync(user))
            return AuthResult.Failure("LockedOut", "Account temporarily locked. Try again later.");

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user);
            return InvalidCredentials();
        }

        await userManager.ResetAccessFailedCountAsync(user);
        var roles = await userManager.GetRolesAsync(user);
        return AuthResult.Success(tokens.CreateToken(user, roles));
    }

    public async Task<CurrentUserResponse?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return null;

        var roles = await userManager.GetRolesAsync(user);
        return new CurrentUserResponse(user.Id, user.Email!, user.FirstName, user.LastName, roles.ToList());
    }

    private static AuthResult InvalidCredentials() =>
        AuthResult.Failure("InvalidCredentials", "Invalid email or password.");

    private static Dictionary<string, string[]> ToErrors(IdentityResult result) =>
        result.Errors
            .Where(e => e.Code != nameof(IdentityErrorDescriber.DuplicateUserName))
            .GroupBy(e => e.Code)
            .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
}