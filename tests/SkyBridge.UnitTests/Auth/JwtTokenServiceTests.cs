using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Microsoft.IdentityModel.JsonWebTokens;
using SkyBridge.Domain.Users;
using SkyBridge.Infrastructure.Auth;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.UnitTests.Auth;

public class JwtTokenServiceTests
{
    private static readonly JwtOptions JwtSettings = new()
    {
        Issuer = "skybridge-tests",
        Audience = "skybridge-tests",
        Key = new string('k', 64),
        ExpiryMinutes = 60
    };

    [Fact]
    public void CreateToken_ContainsUserClaimsRolesAndExpiry()
    {
        var time = new FakeTimeProvider(new DateTimeOffset(2026, 11, 22, 12, 0, 0, TimeSpan.Zero));
        var service = new JwtTokenService(Options.Create(JwtSettings), time);
        var user = new ApplicationUser { Id = Guid.NewGuid(), Email = "pilot@skybridge.test", FirstName = "Ana", LastName = "Silva" };

        var result = service.CreateToken(user, [Roles.Pilot]);

        var token = new JsonWebTokenHandler().ReadJsonWebToken(result.AccessToken);
        Assert.Equal(user.Id.ToString(), token.Subject);
        Assert.Equal("skybridge-tests", token.Issuer);
        Assert.Equal("pilot@skybridge.test", token.GetClaim("email").Value);
        Assert.Equal("Ana Silva", token.GetClaim("name").Value);
        Assert.Contains(token.Claims, c => c.Type == "role" && c.Value == Roles.Pilot);
        Assert.Equal(new DateTime(2026, 11, 22, 13, 0, 0, DateTimeKind.Utc), result.ExpiresAtUtc);
    }
}