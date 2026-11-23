using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Airlines;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class AirlineAircraftConfiguration : IEntityTypeConfiguration<AirlineAircraft>
{
    public void Configure(EntityTypeBuilder<AirlineAircraft> builder)
    {
        builder.ToTable("AirlineFleet");
        builder.HasKey(f => new { f.AirlineId, f.AircraftTypeId });

        builder.HasOne<AircraftType>()
            .WithMany()
            .HasForeignKey(f => f.AircraftTypeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}