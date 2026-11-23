using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.Freelance;
using SkyBridge.Domain.Pilots;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Status).HasConversion<byte>();
        builder.Property(b => b.Source).HasConversion<byte>();
        builder.Ignore(b => b.LegInProgress);

        builder.HasIndex(b => b.PilotUserId)
            .IsUnique()
            .HasFilter("[Status] = 1")
            .HasDatabaseName("IX_Bookings_ActivePilot");

        builder.HasIndex(b => b.FreelanceJobId)
            .IsUnique()
            .HasFilter("[FreelanceJobId] IS NOT NULL AND [Status] IN (1, 2)")
            .HasDatabaseName("IX_Bookings_TakenFreelanceJob");

        builder.HasOne<Pilot>()
            .WithMany()
            .HasForeignKey(b => b.PilotUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<FreelanceJob>()
            .WithMany()
            .HasForeignKey(b => b.FreelanceJobId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<AircraftType>()
            .WithMany()
            .HasForeignKey(b => b.AircraftTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}