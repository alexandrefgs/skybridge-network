using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Airports;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class AirportConfiguration : IEntityTypeConfiguration<Airport>
{
    public void Configure(EntityTypeBuilder<Airport> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Ident).HasMaxLength(16).IsRequired();
        builder.Property(a => a.IcaoCode).HasMaxLength(4);
        builder.Property(a => a.IataCode).HasMaxLength(3);
        builder.Property(a => a.Name).HasMaxLength(200).IsRequired();
        builder.Property(a => a.CountryCode).HasMaxLength(2).IsRequired();
        builder.Property(a => a.RegionCode).HasMaxLength(10).IsRequired();
        builder.Property(a => a.Municipality).HasMaxLength(200);

        builder.HasIndex(a => a.Ident).IsUnique();
        builder.HasIndex(a => a.IcaoCode);
        builder.HasIndex(a => a.IataCode);
        builder.HasIndex(a => a.CountryCode);
    }
}