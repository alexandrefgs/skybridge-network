using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Airports;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class RunwayConfiguration : IEntityTypeConfiguration<Runway>
{
    public void Configure(EntityTypeBuilder<Runway> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.LowEndIdent).HasMaxLength(10);
        builder.Property(r => r.HighEndIdent).HasMaxLength(10);
        builder.Property(r => r.Surface).HasMaxLength(50);
        builder.Property(r => r.SurfaceType).HasConversion<byte>();
        builder.Ignore(r => r.IsHardSurface);

        builder.HasIndex(r => r.AirportId);
        builder.HasIndex(r => r.SourceId);
    }
}