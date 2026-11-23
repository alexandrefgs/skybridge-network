using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Airlines;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Routes;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class RouteConfiguration : IEntityTypeConfiguration<Route>
{
    public void Configure(EntityTypeBuilder<Route> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.AtsRoute).HasMaxLength(Route.MaxAtsRouteLength);
        builder.HasIndex(r => new { r.AirlineId, r.OriginAirportId, r.DestinationAirportId }).IsUnique();

        builder.HasOne<Airline>()
            .WithMany()
            .HasForeignKey(r => r.AirlineId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(r => r.OriginAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(r => r.DestinationAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Aircraft)
            .WithOne()
            .HasForeignKey(a => a.RouteId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(r => r.Aircraft).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}