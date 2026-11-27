using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Filters;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Account;
using SkyBridge.Application.Auth;
using SkyBridge.Application.Profile;
using SkyBridge.Domain.Users;

namespace SkyBridge.Api.Controllers;

[ApiController]
[AllowInactiveAccount]
[Authorize]
[Route("api/account")]
public class AccountController(IProfileService profiles, IAccountLifecycle lifecycle) : ControllerBase
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

    [HttpGet("status")]
    [ProducesResponseType<AccountStatusResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Status(CancellationToken cancellationToken) =>
        await lifecycle.GetStatusAsync(User.GetUserId(), cancellationToken) is { } status ? Ok(status) : NotFound();

    [HttpPost("reactivate")]
    [ProducesResponseType<AccountStatusResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reactivate(CancellationToken cancellationToken) =>
        this.ToActionResult(await lifecycle.ReactivateAsync(User.GetUserId(), cancellationToken), Ok);

    [HttpPost("regulations/accept")]
    [ProducesResponseType<AccountStatusResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AcceptRegulations(AcceptRegulationsRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await lifecycle.AcceptRegulationsAsync(User.GetUserId(), request, cancellationToken), Ok);

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete([FromBody] DeleteAccountRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await lifecycle.DeleteAsync(User.GetUserId(), request, cancellationToken), _ => NoContent());
}