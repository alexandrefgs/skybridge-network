using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;

namespace SkyBridge.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Airline> Airlines => Set<Airline>();
    public DbSet<Aircraft> Aircrafts => Set<Aircraft>();
    public DbSet<FlightRoute> FlightRoutes => Set<FlightRoute>();
    public DbSet<Pilot> Pilots => Set<Pilot>();
    public DbSet<Rank> Ranks => Set<Rank>();
    public DbSet<PilotCareer> PilotCareers => Set<PilotCareer>();
    public DbSet<Pirep> Pireps => Set<Pirep>();
    public DbSet<Tour> Tours => Set<Tour>();
    public DbSet<TourStop> TourStops => Set<TourStop>();
    public DbSet<TourProgress> TourProgresses => Set<TourProgress>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        foreach (var fk in modelBuilder.Model.GetEntityTypes().SelectMany(t => t.GetForeignKeys()))
        {
            fk.DeleteBehavior = DeleteBehavior.Restrict;
        }

        SeedData.Popular(modelBuilder);
    }
}