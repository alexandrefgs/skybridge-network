using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Pilots;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/pilot")]
public class PilotController(IPilotService pilots) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PilotResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) =>
        Ok(await pilots.GetAsync(User.GetUserId(), cancellationToken));

    [HttpPost("jumpseat")]
    [ProducesResponseType<PilotResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Jumpseat(JumpseatRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await pilots.JumpseatAsync(User.GetUserId(), request, cancellationToken), Ok);
}