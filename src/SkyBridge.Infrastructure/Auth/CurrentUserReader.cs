using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Auth;
using SkyBridge.Infrastructure.Identity;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Auth;

internal sealed class CurrentUserReader(UserManager<ApplicationUser> userManager, SkyBridgeDbContext db)
{
    public async Task<CurrentUserResponse> ReadAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var roles = await userManager.GetRolesAsync(user);
        var avatarUpdatedAt = await db.UserImages
            .Where(i => i.UserId == user.Id && i.Kind == UserImageKind.Avatar)
            .Select(i => (DateTime?)i.UpdatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        return new CurrentUserResponse(
            user.Id,
            user.Email!,
            user.FirstName,
            user.LastName,
            user.TwoFactorEnabled,
            roles.ToList(),
            AvatarUrl(user.Id, avatarUpdatedAt));
    }

    public static string? AvatarUrl(Guid userId, DateTime? updatedAtUtc) =>
        updatedAtUtc is { } updatedAt ? $"/api/users/{userId}/avatar?v={updatedAt.Ticks}" : null;
}