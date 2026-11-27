using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Domain.Staff;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class StaffMemberConfiguration : IEntityTypeConfiguration<StaffMember>
{
    public void Configure(EntityTypeBuilder<StaffMember> builder)
    {
        builder.HasKey(m => m.UserId);
        builder.Property(m => m.Position).HasMaxLength(StaffMember.MaxPositionLength).IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithOne()
            .HasForeignKey<StaffMember>(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}