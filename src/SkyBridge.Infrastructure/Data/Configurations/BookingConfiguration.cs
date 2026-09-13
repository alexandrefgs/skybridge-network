using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Entities;

namespace SkyBridge.Infrastructure.Data.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.Property(b => b.Callsign).HasMaxLength(10);

        builder.HasIndex(b => b.PilotId);
        builder.HasIndex(b => b.FlightRouteId);
        builder.HasIndex(b => b.Status);
    }
}