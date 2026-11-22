using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Persistence;

public class SkyBridgeDbContext(DbContextOptions<SkyBridgeDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(SkyBridgeDbContext).Assembly);
    }
}