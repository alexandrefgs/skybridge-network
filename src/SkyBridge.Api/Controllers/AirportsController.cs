using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Airports;
using SkyBridge.Application.Common;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/airports")]
public class AirportsController(IAirportQueries airports) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<AirportResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? country,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await airports.SearchAsync(new AirportSearch(q, country, page, pageSize), cancellationToken));

    [HttpGet("{ident}")]
    [ProducesResponseType<AirportResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(string ident, CancellationToken cancellationToken)
    {
        var airport = await airports.GetAsync(ident, cancellationToken);
        return airport is null ? NotFound() : Ok(airport);
    }

    [HttpGet("{ident}/runways")]
    [ProducesResponseType<IReadOnlyList<RunwayResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Runways(string ident, CancellationToken cancellationToken)
    {
        var runways = await airports.GetRunwaysAsync(ident, cancellationToken);
        return runways is null ? NotFound() : Ok(runways);
    }
}