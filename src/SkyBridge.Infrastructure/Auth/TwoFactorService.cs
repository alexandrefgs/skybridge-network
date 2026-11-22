using Microsoft.AspNetCore.Identity;
using SkyBridge.Application.Auth;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Auth;

internal sealed class TwoFactorService(UserManager<ApplicationUser> userManager) : ITwoFactorService
{
    private const string Issuer = "SkyBridge";
    private const int RecoveryCodeCount = 10;

    public async Task<AuthResult<TwoFactorSetupResponse>> SetupAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return AuthResult<TwoFactorSetupResponse>.Failure("UserNotFound", "User not found.");

        if (user.TwoFactorEnabled)
            return AuthResult<TwoFactorSetupResponse>.Failure("AlreadyEnabled", "Two-factor authentication is already enabled.");

        await userManager.ResetAuthenticatorKeyAsync(user);
        var key = (await userManager.GetAuthenticatorKeyAsync(user))!;

        return AuthResult<TwoFactorSetupResponse>.Success(new TwoFactorSetupResponse(FormatKey(key), BuildUri(user.Email!, key)));
    }

    public async Task<AuthResult<RecoveryCodesResponse>> EnableAsync(Guid userId, string code, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return AuthResult<RecoveryCodesResponse>.Failure("UserNotFound", "User not found.");

        if (user.TwoFactorEnabled)
            return AuthResult<RecoveryCodesResponse>.Failure("AlreadyEnabled", "Two-factor authentication is already enabled.");

        if (string.IsNullOrEmpty(await userManager.GetAuthenticatorKeyAsync(user)))
            return AuthResult<RecoveryCodesResponse>.Failure("SetupRequired", "Start the two-factor setup first.");

        if (!await IsValidAuthenticatorCodeAsync(user, code))
            return AuthResult<RecoveryCodesResponse>.Failure("InvalidCode", "Invalid verification code.");

        await userManager.SetTwoFactorEnabledAsync(user, true);
        var recoveryCodes = await userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, RecoveryCodeCount);

        return AuthResult<RecoveryCodesResponse>.Success(new RecoveryCodesResponse(recoveryCodes!.ToList()));
    }

    public async Task<AuthResult<bool>> DisableAsync(Guid userId, string code, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return AuthResult<bool>.Failure("UserNotFound", "User not found.");

        if (!user.TwoFactorEnabled)
            return AuthResult<bool>.Failure("NotEnabled", "Two-factor authentication is not enabled.");

        if (!await IsValidAuthenticatorCodeAsync(user, code))
            return AuthResult<bool>.Failure("InvalidCode", "Invalid verification code.");

        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);

        return AuthResult<bool>.Success(true);
    }

    private Task<bool> IsValidAuthenticatorCodeAsync(ApplicationUser user, string code) =>
        userManager.VerifyTwoFactorTokenAsync(user, userManager.Options.Tokens.AuthenticatorTokenProvider, TwoFactorCode.Normalize(code));

    private static string FormatKey(string key) =>
        string.Join(' ', key.ToLowerInvariant().Chunk(4).Select(chunk => new string(chunk)));

    private static string BuildUri(string email, string key) =>
        $"otpauth://totp/{Uri.EscapeDataString(Issuer)}:{Uri.EscapeDataString(email)}?secret={key}&issuer={Uri.EscapeDataString(Issuer)}&digits=6";
}