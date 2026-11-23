using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Auth;
using SkyBridge.Application.Profile;
using SkyBridge.Domain.Users;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/account")]
public class AccountController(IProfileService profiles) : ControllerBase
{
    private const long MaxRequestBytes = ProfileImage.MaxBytes + 64 * 1024;

    [HttpPut("profile")]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await profiles.UpdateAsync(User.GetUserId(), request, cancellationToken), Ok);

    [HttpPut("avatar")]
    [RequestSizeLimit(MaxRequestBytes)]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetAvatar(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0 || file.Length > ProfileImage.MaxBytes)
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["file"] = ["Choose a picture up to 2 MB."]
            }));

        using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer, cancellationToken);
        return this.ToActionResult(await profiles.SetAvatarAsync(User.GetUserId(), buffer.ToArray(), cancellationToken), Ok);
    }

    [HttpDelete("avatar")]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveAvatar(CancellationToken cancellationToken) =>
        this.ToActionResult(await profiles.RemoveAvatarAsync(User.GetUserId(), cancellationToken), Ok);
}