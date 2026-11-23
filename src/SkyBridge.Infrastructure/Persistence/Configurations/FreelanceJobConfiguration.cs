using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Freelance;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class FreelanceJobConfiguration : IEntityTypeConfiguration<FreelanceJob>
{
    public void Configure(EntityTypeBuilder<FreelanceJob> builder)
    {
        builder.HasKey(j => j.Id);
        builder.Property(j => j.Kind).HasConversion<byte>();
        builder.Property(j => j.Client).HasMaxLength(FreelanceJob.MaxClientLength);
        builder.Property(j => j.Briefing).HasMaxLength(FreelanceJob.MaxBriefingLength);

        builder.HasIndex(j => j.ExpiresAtUtc);
        builder.HasIndex(j => j.OriginAirportId);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(j => j.OriginAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(j => j.DestinationAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(j => j.Aircraft)
            .WithOne()
            .HasForeignKey(a => a.FreelanceJobId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(j => j.Aircraft).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(j => j.Legs)
            .WithOne()
            .HasForeignKey(l => l.FreelanceJobId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(j => j.Legs).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class FreelanceJobLegConfiguration : IEntityTypeConfiguration<FreelanceJobLeg>
{
    public void Configure(EntityTypeBuilder<FreelanceJobLeg> builder)
    {
        builder.HasKey(l => l.Id);
        builder.HasIndex(l => new { l.FreelanceJobId, l.Sequence });
        builder.PrimitiveCollection(l => l.PassengerNames);
        builder.OwnsMany(l => l.DangerousGoods, goods => goods.ToJson());

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(l => l.OriginAirportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Airport>()
            .WithMany()
            .HasForeignKey(l => l.DestinationAirportId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class FreelanceJobAircraftConfiguration : IEntityTypeConfiguration<FreelanceJobAircraft>
{
    public void Configure(EntityTypeBuilder<FreelanceJobAircraft> builder)
    {
        builder.HasKey(a => new { a.FreelanceJobId, a.AircraftTypeId });

        builder.HasOne<AircraftType>()
            .WithMany()
            .HasForeignKey(a => a.AircraftTypeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}