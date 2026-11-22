using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Infrastructure.Persistence.Seed;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class AircraftCategoryConfiguration : IEntityTypeConfiguration<AircraftCategory>
{
    public void Configure(EntityTypeBuilder<AircraftCategory> builder)
    {
        builder.HasKey(c => c.Code);
        builder.Property(c => c.Code).ValueGeneratedNever();
        builder.Property(c => c.Name).HasMaxLength(50).IsRequired();

        builder.HasData(AircraftCatalogSeed.Categories());
    }
}