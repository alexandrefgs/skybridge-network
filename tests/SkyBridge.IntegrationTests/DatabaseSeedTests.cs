using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using SkyBridge.Domain.Users;
using SkyBridge.Infrastructure.Identity;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class DatabaseSeedTests(SkyBridgeApiFactory factory)
{
    [Fact]
    public async Task Startup_SeedsDefaultRoles()
    {
        _ = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        foreach (var role in Roles.All)
            Assert.True(await roleManager.RoleExistsAsync(role), $"Role '{role}' was not seeded.");
    }

    [Fact]
    public async Task Startup_SeedsAdminWithAllRoles()
    {
        _ = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var admin = await userManager.FindByEmailAsync(SkyBridgeApiFactory.AdminEmail);

        Assert.NotNull(admin);
        Assert.Equal(Roles.All.Order(), (await userManager.GetRolesAsync(admin)).Order());
    }
}