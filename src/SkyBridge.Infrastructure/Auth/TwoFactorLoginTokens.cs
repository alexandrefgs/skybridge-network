using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Auth;

public sealed class TwoFactorLoginTokens(IDataProtectionProvider provider)
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);

    private readonly ITimeLimitedDataProtector _protector =
        provider.CreateProtector("SkyBridge.TwoFactorLogin").ToTimeLimitedDataProtector();

    public string Create(ApplicationUser user) =>
        _protector.Protect($"{user.Id}|{user.SecurityStamp}", Lifetime);

    public (Guid UserId, string SecurityStamp)? Read(string token)
    {
        try
        {
            var parts = _protector.Unprotect(token).Split('|', 2);
            return parts.Length == 2 && Guid.TryParse(parts[0], out var userId) ? (userId, parts[1]) : null;
        }
        catch (Exception e) when (e is CryptographicException or FormatException)
        {
            return null;
        }
    }
}