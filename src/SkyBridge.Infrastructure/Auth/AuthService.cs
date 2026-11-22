using Microsoft.AspNetCore.Identity;
using SkyBridge.Application.Auth;
using SkyBridge.Domain.Users;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Auth;

internal sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    JwtTokenService tokens,
    TwoFactorLoginTokens twoFactorTokens) : IAuthService
{
    public async Task<AuthResult<LoginResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
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
            return AuthResult<LoginResponse>.Failure(ToErrors(created));

        var roleAdded = await userManager.AddToRoleAsync(user, Roles.Pilot);
        if (!roleAdded.Succeeded)
            return AuthResult<LoginResponse>.Failure(ToErrors(roleAdded));

        return AuthResult<LoginResponse>.Success(LoginResponse.Authenticated(tokens.CreateToken(user, [Roles.Pilot])));
    }

    public async Task<AuthResult<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return Failure("InvalidCredentials", "Invalid email or password.");

        if (await userManager.IsLockedOutAsync(user))
            return LockedOut();

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user);
            return Failure("InvalidCredentials", "Invalid email or password.");
        }

        if (user.TwoFactorEnabled)
            return AuthResult<LoginResponse>.Success(LoginResponse.TwoFactorRequired(twoFactorTokens.Create(user)));

        return await SignInAsync(user);
    }

    public async Task<AuthResult<LoginResponse>> LoginWithTwoFactorAsync(TwoFactorLoginRequest request, CancellationToken cancellationToken)
    {
        var payload = twoFactorTokens.Read(request.TwoFactorToken);
        if (payload is null)
            return SessionExpired();

        var user = await userManager.FindByIdAsync(payload.Value.UserId.ToString());
        if (user is null || !user.TwoFactorEnabled || user.SecurityStamp != payload.Value.SecurityStamp)
            return SessionExpired();

        if (await userManager.IsLockedOutAsync(user))
            return LockedOut();

        if (!await IsValidSecondFactorAsync(user, request.Code))
        {
            await userManager.AccessFailedAsync(user);
            return Failure("InvalidCode", "Invalid verification code.");
        }

        return await SignInAsync(user);
    }

    public async Task<CurrentUserResponse?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return null;

        var roles = await userManager.GetRolesAsync(user);
        return new CurrentUserResponse(user.Id, user.Email!, user.FirstName, user.LastName, user.TwoFactorEnabled, roles.ToList());
    }

    private async Task<bool> IsValidSecondFactorAsync(ApplicationUser user, string code)
    {
        var provider = userManager.Options.Tokens.AuthenticatorTokenProvider;
        if (await userManager.VerifyTwoFactorTokenAsync(user, provider, TwoFactorCode.Normalize(code)))
            return true;

        var redeemed = await userManager.RedeemTwoFactorRecoveryCodeAsync(user, code.Trim());
        return redeemed.Succeeded;
    }

    private async Task<AuthResult<LoginResponse>> SignInAsync(ApplicationUser user)
    {
        await userManager.ResetAccessFailedCountAsync(user);
        var roles = await userManager.GetRolesAsync(user);
        return AuthResult<LoginResponse>.Success(LoginResponse.Authenticated(tokens.CreateToken(user, roles)));
    }

    private static AuthResult<LoginResponse> Failure(string code, string message) =>
        AuthResult<LoginResponse>.Failure(code, message);

    private static AuthResult<LoginResponse> LockedOut() =>
        Failure("LockedOut", "Account temporarily locked. Try again later.");

    private static AuthResult<LoginResponse> SessionExpired() =>
        Failure("TwoFactorSessionExpired", "Your sign-in session expired. Please sign in again.");

    private static Dictionary<string, string[]> ToErrors(IdentityResult result) =>
        result.Errors
            .Where(e => e.Code != nameof(IdentityErrorDescriber.DuplicateUserName))
            .GroupBy(e => e.Code)
            .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
}