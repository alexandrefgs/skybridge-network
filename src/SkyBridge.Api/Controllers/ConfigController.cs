using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SkyBridge.Api.Filters;
using SkyBridge.Api.Options;

namespace SkyBridge.Api.Controllers;

public sealed record ClientConfigResponse(string? CartoApiKey, string? ContactEmail, string? DiscordUrl, string? InstagramUrl);

[ApiController]
[AllowInactiveAccount]
[Route("api/config")]
public class ConfigController(IOptions<MapOptions> maps, IOptions<SiteOptions> site) : ControllerBase
{
    [HttpGet("client")]
    [ProducesResponseType<ClientConfigResponse>(StatusCodes.Status200OK)]
    public IActionResult Client() =>
        Ok(new ClientConfigResponse(maps.Value.CartoApiKey, site.Value.ContactEmail, site.Value.DiscordUrl, site.Value.InstagramUrl));
}