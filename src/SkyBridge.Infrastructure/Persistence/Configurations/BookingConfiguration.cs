using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.Freelance;
using SkyBridge.Domain.Pilots;
using SkyBridge.Domain.Routes;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Status).HasConversion<byte>();
        builder.Property(b => b.Source).HasConversion<byte>();
        builder.Ignore(b => b.LegInProgress);
        builder.Property(b => b.FlightNumber).HasMaxLength(10);
        builder.Property(b => b.AirlineName).HasMaxLength(Booking.MaxAirlineNameLength);

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

        builder.HasOne<Route>()
            .WithMany()
            .HasForeignKey(b => b.RouteId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(b => b.OriginAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(b => b.DestinationAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<AircraftType>()
            .WithMany()
            .HasForeignKey(b => b.AircraftTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}