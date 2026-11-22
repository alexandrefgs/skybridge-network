using SkyBridge.Domain.Users;

namespace SkyBridge.UnitTests.Domain;

public class RolesTests
{
    [Fact]
    public void All_ContainsEachRoleOnce()
    {
        Assert.Equal(new[] { Roles.Admin, Roles.Staff, Roles.Pilot }, Roles.All);
    }
}