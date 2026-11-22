using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Aircraft;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class AircraftTypeConfiguration : IEntityTypeConfiguration<AircraftType>
{
    public void Configure(EntityTypeBuilder<AircraftType> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.IcaoCode).HasMaxLength(4).IsRequired();
        builder.Property(t => t.Manufacturer).HasMaxLength(60).IsRequired();
        builder.Property(t => t.Model).HasMaxLength(60).IsRequired();

        builder.HasIndex(t => t.IcaoCode).IsUnique();

        builder.HasOne<AircraftCategory>()
            .WithMany()
            .HasForeignKey(t => t.Category)
            .OnDelete(DeleteBehavior.Restrict);
    }
}