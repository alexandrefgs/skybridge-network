using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Airlines;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class AirlineConfiguration : IEntityTypeConfiguration<Airline>
{
    public void Configure(EntityTypeBuilder<Airline> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Name).HasMaxLength(100).IsRequired();
        builder.Property(a => a.IataCode).HasMaxLength(2);
        builder.Property(a => a.IcaoCode).HasMaxLength(3);
        builder.Property(a => a.Callsign).HasMaxLength(60);
        builder.Property(a => a.Country).HasMaxLength(60);
        builder.Property(a => a.RoutesSource).HasMaxLength(20);

        builder.HasIndex(a => a.SourceId).IsUnique().HasFilter("[SourceId] IS NOT NULL");
        builder.HasIndex(a => a.IcaoCode);
        builder.HasIndex(a => a.IataCode);
        builder.HasIndex(a => a.Name);

        builder.HasMany(a => a.Fleet)
            .WithOne()
            .HasForeignKey(f => f.AirlineId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(a => a.Fleet).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}