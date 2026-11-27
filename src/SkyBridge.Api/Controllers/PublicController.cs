using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Public;
using SkyBridge.Application.Staff;

namespace SkyBridge.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/public")]
public class PublicController(IPublicQueries queries, IStaffDirectory staff) : ControllerBase
{
    [HttpGet("stats")]
    [ProducesResponseType<PublicStatsResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Stats(CancellationToken cancellationToken) =>
        Ok(await queries.GetStatsAsync(cancellationToken));

    [HttpGet("flights")]
    [ProducesResponseType<IReadOnlyList<PublicFlightResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Flights([FromQuery] int count = 4, CancellationToken cancellationToken = default) =>
        Ok(await queries.GetRecentFlightsAsync(count, cancellationToken));

    [HttpGet("staff")]
    [ProducesResponseType<IReadOnlyList<PublicStaffResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Staff(CancellationToken cancellationToken) =>
        Ok(await staff.PublicListAsync(cancellationToken));
}