using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SkyBridge.Application.Airports;
using SkyBridge.Domain.Users;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var provider = scope.ServiceProvider;
        var logger = provider.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DatabaseInitializer));
        var seed = provider.GetRequiredService<IOptions<SeedOptions>>().Value;

        var db = provider.GetRequiredService<SkyBridgeDbContext>();
        await db.Database.MigrateAsync(cancellationToken);

        await SeedRolesAsync(provider.GetRequiredService<RoleManager<IdentityRole<Guid>>>());
        await SeedAdminAsync(provider.GetRequiredService<UserManager<ApplicationUser>>(), seed, logger);

        if (seed.ImportAirports && !await db.Airports.AnyAsync(cancellationToken))
            await SeedAirportsAsync(provider, logger, cancellationToken);
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole<Guid>> roleManager)
    {
        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }
    }

    private static async Task SeedAdminAsync(UserManager<ApplicationUser> userManager, SeedOptions seed, ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(seed.AdminEmail))
            return;

        var admin = await userManager.FindByEmailAsync(seed.AdminEmail);
        if (admin is null)
        {
            if (string.IsNullOrWhiteSpace(seed.AdminPassword))
            {
                logger.LogWarning("Seed:AdminEmail is set but Seed:AdminPassword is missing. Admin user was not created.");
                return;
            }

            admin = new ApplicationUser
            {
                UserName = seed.AdminEmail,
                Email = seed.AdminEmail,
                EmailConfirmed = true,
                FirstName = "SkyBridge",
                LastName = "Admin"
            };

            var created = await userManager.CreateAsync(admin, seed.AdminPassword);
            if (!created.Succeeded)
                throw new InvalidOperationException($"Could not seed admin: {string.Join("; ", created.Errors.Select(e => e.Description))}");
        }

        foreach (var role in Roles.All)
        {
            if (!await userManager.IsInRoleAsync(admin, role))
                await userManager.AddToRoleAsync(admin, role);
        }
    }

    private static async Task SeedAirportsAsync(IServiceProvider provider, ILogger logger, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Airports table is empty. Importing from OurAirports, this can take a minute...");
            await using var csv = await provider.GetRequiredService<IAirportSource>().OpenAirportsCsvAsync(cancellationToken);
            await provider.GetRequiredService<IAirportImporter>().ImportAsync(csv, cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception, "Could not download OurAirports data. Airports were not imported.");
        }
    }
}