using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Airlines;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.Freelance;
using SkyBridge.Domain.Pilots;
using SkyBridge.Domain.Pireps;
using SkyBridge.Domain.Routes;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Persistence;

public class SkyBridgeDbContext(DbContextOptions<SkyBridgeDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Airport> Airports => Set<Airport>();
    public DbSet<Runway> Runways => Set<Runway>();
    public DbSet<AircraftCategory> AircraftCategories => Set<AircraftCategory>();
    public DbSet<AircraftType> AircraftTypes => Set<AircraftType>();
    public DbSet<Airline> Airlines => Set<Airline>();
    public DbSet<Route> Routes => Set<Route>();
    public DbSet<UserImage> UserImages => Set<UserImage>();
    public DbSet<Pilot> Pilots => Set<Pilot>();
    public DbSet<FreelanceJob> FreelanceJobs => Set<FreelanceJob>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Pirep> Pireps => Set<Pirep>();
    public DbSet<PilotTransaction> PilotTransactions => Set<PilotTransaction>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(SkyBridgeDbContext).Assembly);
    }
}