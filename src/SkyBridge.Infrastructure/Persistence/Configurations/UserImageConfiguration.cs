using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkyBridge.Infrastructure.Identity;

namespace SkyBridge.Infrastructure.Persistence.Configurations;

internal sealed class UserImageConfiguration : IEntityTypeConfiguration<UserImage>
{
    public void Configure(EntityTypeBuilder<UserImage> builder)
    {
        builder.ToTable("UserImages");
        builder.HasKey(i => new { i.UserId, i.Kind });
        builder.Property(i => i.Kind).HasConversion<byte>();
        builder.Property(i => i.Content).IsRequired();
        builder.Property(i => i.ContentType).HasMaxLength(50).IsRequired();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}