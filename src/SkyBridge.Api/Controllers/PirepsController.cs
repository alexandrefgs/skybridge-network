using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Common;
using SkyBridge.Application.Pireps;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/pireps")]
public class PirepsController(IPirepService pireps) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<PirepFiledResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FilePirep(FilePirepRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await pireps.FileAsync(User.GetUserId(), request, cancellationToken), Ok);

    [HttpGet("mine")]
    [ProducesResponseType<PagedResult<PirepResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Mine([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default) =>
        Ok(await pireps.GetMineAsync(User.GetUserId(), page, pageSize, cancellationToken));

    
    [HttpGet("logbook")]
    [ProducesResponseType<LogbookResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Logbook([FromQuery] string? period = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        this.ToActionResult(await pireps.GetLogbookAsync(User.GetUserId(), new LogbookSearch(period, page, pageSize), cancellationToken), Ok);
}