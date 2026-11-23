using SkyBridge.Application.Auth;
using SkyBridge.Application.Common;

namespace SkyBridge.Application.Profile;

public interface IProfileService
{
    Task<Result<CurrentUserResponse>> UpdateAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken);
    Task<Result<CurrentUserResponse>> SetAvatarAsync(Guid userId, byte[] content, CancellationToken cancellationToken);
    Task<Result<CurrentUserResponse>> RemoveAvatarAsync(Guid userId, CancellationToken cancellationToken);
    Task<ImageFile?> GetAvatarAsync(Guid userId, CancellationToken cancellationToken);
}