using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Enums;

namespace SkyBridge.Infrastructure.Data.Configurations;

public class AircraftConfiguration : IEntityTypeConfiguration<Aircraft>
{
    public void Configure(EntityTypeBuilder<Aircraft> builder)
    {
        var comparer = new ValueComparer<List<OperationType>>(
            (a, b) => a!.SequenceEqual(b!),
            v => v.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
            v => v.ToList());

        builder.Property(a => a.TiposOperacaoSuportados)
            .HasConversion(
                v => string.Join(',', v),
                v => v.Length == 0
                    ? new List<OperationType>()
                    : v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(Enum.Parse<OperationType>)
                        .ToList())
            .Metadata.SetValueComparer(comparer);
    }
}