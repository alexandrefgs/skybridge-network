using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using SkyBridge.Application.Profile;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(IProfileService profiles) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("{id:guid}/avatar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Avatar(Guid id, [FromQuery] long? v, CancellationToken cancellationToken)
    {
        var avatar = await profiles.GetAvatarAsync(id, cancellationToken);
        if (avatar is null)
            return NotFound();

        Response.Headers.CacheControl = v is null ? "no-cache" : "public, max-age=31536000, immutable";
        var updatedAt = DateTime.SpecifyKind(avatar.UpdatedAtUtc, DateTimeKind.Utc);
        return File(avatar.Content, avatar.ContentType, new DateTimeOffset(updatedAt), new EntityTagHeaderValue($"\"{updatedAt.Ticks}\""));
    }
}