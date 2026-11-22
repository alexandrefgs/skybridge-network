using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SkyBridge.Api.Options;

namespace SkyBridge.Api.Controllers;

public sealed record ClientConfigResponse(string? CartoApiKey);

[ApiController]
[Route("api/config")]
public class ConfigController(IOptions<MapOptions> maps) : ControllerBase
{
    [HttpGet("client")]
    [ProducesResponseType<ClientConfigResponse>(StatusCodes.Status200OK)]
    public IActionResult Client() => Ok(new ClientConfigResponse(maps.Value.CartoApiKey));
}