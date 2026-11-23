using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Common;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/airlines")]
public class AirlinesController(IAirlineQueries airlines) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<AirlineResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] bool? active,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await airlines.SearchAsync(new AirlineSearch(q, active, page, pageSize), cancellationToken));

    [HttpGet("{id:int}")]
    [ProducesResponseType<AirlineDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
    {
        var airline = await airlines.GetAsync(id, cancellationToken);
        return airline is null ? NotFound() : Ok(airline);
    }

    [HttpGet("{id:int}/network")]
    [ProducesResponseType<RouteNetworkResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Network(int id, CancellationToken cancellationToken)
    {
        var network = await airlines.GetNetworkAsync(id, cancellationToken);
        return network is null ? NotFound() : Ok(network);
    }

    [HttpGet("{id:int}/routes")]
    [ProducesResponseType<PagedResult<RouteResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Routes(
        int id,
        [FromQuery] string? q,
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var routes = await airlines.GetRoutesAsync(id, new RouteSearch(q, page, pageSize, from, to), cancellationToken);
        return routes is null ? NotFound() : Ok(routes);
    }
}