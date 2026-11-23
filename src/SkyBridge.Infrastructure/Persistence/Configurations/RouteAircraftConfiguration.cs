using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Routes;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class RouteAircraftConfiguration : IEntityTypeConfiguration<RouteAircraft>
{
    public void Configure(EntityTypeBuilder<RouteAircraft> builder)
    {
        builder.HasKey(a => new { a.RouteId, a.AircraftTypeId });

        builder.HasOne<AircraftType>()
            .WithMany()
            .HasForeignKey(a => a.AircraftTypeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}