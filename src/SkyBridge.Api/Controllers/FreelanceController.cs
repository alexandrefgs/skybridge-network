using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Common;
using SkyBridge.Application.Freelance;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/freelance")]
public class FreelanceController(IFreelanceQueries jobs) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<FreelanceJobResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string? from,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await jobs.SearchAsync(new FreelanceJobSearch(from, false, page, pageSize), cancellationToken));

    [HttpGet("{id:int}")]
    [ProducesResponseType<FreelanceJobResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    {
        var job = await jobs.GetAsync(id, cancellationToken);
        return job is null || job.Expired ? NotFound() : Ok(job);
    }
}