using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Aircraft;
using SkyBridge.Domain.Aircraft;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api")]
public class AircraftController(IAircraftCatalog catalog) : ControllerBase
{
    [HttpGet("aircraft-categories")]
    [ProducesResponseType<IReadOnlyList<AircraftCategoryResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken) =>
        Ok(await catalog.GetCategoriesAsync(cancellationToken));

    [HttpGet("aircraft-types")]
    [ProducesResponseType<IReadOnlyList<AircraftTypeResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTypes([FromQuery] AircraftCategoryCode? category, [FromQuery] string? q, CancellationToken cancellationToken) =>
        Ok(await catalog.GetTypesAsync(category, q, cancellationToken));

    [HttpGet("aircraft-types/{icaoCode}")]
    [ProducesResponseType<AircraftTypeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetType(string icaoCode, CancellationToken cancellationToken)
    {
        var type = await catalog.GetTypeAsync(icaoCode, cancellationToken);
        return type is null ? NotFound() : Ok(type);
    }
}