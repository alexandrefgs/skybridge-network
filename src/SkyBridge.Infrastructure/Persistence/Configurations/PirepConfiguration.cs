using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.Pilots;
using SkyBridge.Domain.Pireps;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class PirepConfiguration : IEntityTypeConfiguration<Pirep>
{
    public void Configure(EntityTypeBuilder<Pirep> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Status).HasConversion<byte>();
        builder.Property(p => p.Remarks).HasMaxLength(Pirep.MaxRemarksLength);
        builder.Property(p => p.Flag).HasMaxLength(300);
        builder.Property(p => p.ReviewNote).HasMaxLength(Pirep.MaxNoteLength);

        builder.HasIndex(p => new { p.BookingId, p.LegSequence }).IsUnique();
        builder.HasIndex(p => new { p.PilotUserId, p.FiledAtUtc });
        builder.HasIndex(p => p.Status);

        builder.HasOne<Booking>()
            .WithMany()
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(p => p.OriginAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(p => p.DestinationAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<AircraftType>()
            .WithMany()
            .HasForeignKey(p => p.AircraftTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class PilotTransactionConfiguration : IEntityTypeConfiguration<PilotTransaction>
{
    public void Configure(EntityTypeBuilder<PilotTransaction> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Description).HasMaxLength(PilotTransaction.MaxDescriptionLength);
        builder.HasIndex(t => new { t.PilotUserId, t.CreatedAtUtc });

        builder.HasOne<Pilot>()
            .WithMany()
            .HasForeignKey(t => t.PilotUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}