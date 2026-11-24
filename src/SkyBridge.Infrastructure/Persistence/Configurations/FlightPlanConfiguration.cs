using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.FlightPlans;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class FlightPlanConfiguration : IEntityTypeConfiguration<FlightPlan>
{
    public void Configure(EntityTypeBuilder<FlightPlan> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.SimBriefId).HasMaxLength(40);
        builder.Property(p => p.Airac).HasMaxLength(10);
        builder.Property(p => p.Origin).HasMaxLength(8);
        builder.Property(p => p.Destination).HasMaxLength(8);
        builder.Property(p => p.Alternate).HasMaxLength(8);
        builder.Property(p => p.Aircraft).HasMaxLength(8);
        builder.Property(p => p.Registration).HasMaxLength(16);
        builder.Property(p => p.Callsign).HasMaxLength(16);
        builder.Property(p => p.Route).HasMaxLength(FlightPlan.MaxRouteLength);

        builder.HasIndex(p => new { p.BookingId, p.LegSequence }).IsUnique();

        builder.HasOne<Booking>()
            .WithMany()
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}