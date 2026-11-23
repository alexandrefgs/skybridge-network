using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Auth;
using SkyBridge.Application.Common;
using SkyBridge.Application.Profile;
using SkyBridge.Domain.Users;
using SkyBridge.Infrastructure.Auth;
using SkyBridge.Infrastructure.Identity;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Profile;

internal sealed class ProfileService(
    UserManager<ApplicationUser> userManager,
    SkyBridgeDbContext db,
    CurrentUserReader reader,
    TimeProvider time) : IProfileService
{
    public async Task<Result<CurrentUserResponse>> UpdateAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<CurrentUserResponse>.NotFound();

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();

        var updated = await userManager.UpdateAsync(user);
        if (!updated.Succeeded)
            return Result<CurrentUserResponse>.Invalid("profile", updated.Errors.First().Description);

        return Result<CurrentUserResponse>.Ok(await reader.ReadAsync(user, cancellationToken));
    }

    public async Task<Result<CurrentUserResponse>> SetAvatarAsync(Guid userId, byte[] content, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<CurrentUserResponse>.NotFound();

        if (content.Length == 0 || content.Length > ProfileImage.MaxBytes)
            return Result<CurrentUserResponse>.Invalid("file", "Choose a picture up to 2 MB.");

        var contentType = ProfileImage.DetectContentType(content);
        if (contentType is null)
            return Result<CurrentUserResponse>.Invalid("file", "Use a JPG, PNG or WebP picture.");

        var image = await db.UserImages.FindAsync([userId, UserImageKind.Avatar], cancellationToken);
        if (image is null)
        {
            image = new UserImage { UserId = userId, Kind = UserImageKind.Avatar };
            db.UserImages.Add(image);
        }

        image.Content = content;
        image.ContentType = contentType;
        image.UpdatedAtUtc = time.GetUtcNow().UtcDateTime;
        await db.SaveChangesAsync(cancellationToken);

        return Result<CurrentUserResponse>.Ok(await reader.ReadAsync(user, cancellationToken));
    }

    public async Task<Result<CurrentUserResponse>> RemoveAvatarAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<CurrentUserResponse>.NotFound();

        await db.UserImages
            .Where(i => i.UserId == userId && i.Kind == UserImageKind.Avatar)
            .ExecuteDeleteAsync(cancellationToken);

        return Result<CurrentUserResponse>.Ok(await reader.ReadAsync(user, cancellationToken));
    }

    public Task<ImageFile?> GetAvatarAsync(Guid userId, CancellationToken cancellationToken) =>
        db.UserImages
            .AsNoTracking()
            .Where(i => i.UserId == userId && i.Kind == UserImageKind.Avatar)
            .Select(i => new ImageFile(i.Content, i.ContentType, i.UpdatedAtUtc))
            .FirstOrDefaultAsync(cancellationToken);
}