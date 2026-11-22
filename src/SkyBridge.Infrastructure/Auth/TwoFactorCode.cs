namespace SkyBridge.Infrastructure.Auth;

internal static class TwoFactorCode
{
    public static string Normalize(string code) =>
        code.Replace(" ", string.Empty).Replace("-", string.Empty);
}