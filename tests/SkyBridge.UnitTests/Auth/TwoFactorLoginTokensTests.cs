using Microsoft.AspNetCore.DataProtection;
using SkyBridge.Infrastructure.Auth;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.UnitTests.Auth;

public class TwoFactorLoginTokensTests
{
    private readonly TwoFactorLoginTokens _tokens = new(new EphemeralDataProtectionProvider());

    [Fact]
    public void Read_ReturnsUserIdAndSecurityStamp_ForValidToken()
    {
        var user = new ApplicationUser { Id = Guid.NewGuid(), SecurityStamp = "STAMP-123" };

        var payload = _tokens.Read(_tokens.Create(user));

        Assert.NotNull(payload);
        Assert.Equal(user.Id, payload.Value.UserId);
        Assert.Equal("STAMP-123", payload.Value.SecurityStamp);
    }

    [Fact]
    public void Read_ReturnsNull_ForInvalidToken()
    {
        Assert.Null(_tokens.Read("not-a-valid-token"));
    }
}