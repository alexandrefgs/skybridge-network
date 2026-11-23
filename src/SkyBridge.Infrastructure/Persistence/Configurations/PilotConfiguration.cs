using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Pilots;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class PilotConfiguration : IEntityTypeConfiguration<Pilot>
{
    public void Configure(EntityTypeBuilder<Pilot> builder)
    {
        builder.HasKey(p => p.UserId);
        builder.Ignore(p => p.FlightHours);

        builder.HasOne<ApplicationUser>()
            .WithOne()
            .HasForeignKey<Pilot>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(p => p.CurrentAirportId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}