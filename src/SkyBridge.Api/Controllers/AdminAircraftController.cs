using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Aircraft;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Users;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize(Roles = $"{Roles.Admin},{Roles.Staff}")]
[Route("api/admin")]
public class AdminAircraftController(IAircraftCatalog catalog) : ControllerBase
{
    [HttpPut("aircraft-categories/{code}")]
    [ProducesResponseType<AircraftCategoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCategory(AircraftCategoryCode code, UpdateAircraftCategoryRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await catalog.UpdateCategoryAsync(code, request, cancellationToken), Ok);

    [HttpPost("aircraft-types")]
    [ProducesResponseType<AircraftTypeResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateType(AircraftTypeRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await catalog.CreateTypeAsync(request, cancellationToken),
            type => Created($"/api/aircraft-types/{type.IcaoCode}", type));

    [HttpPut("aircraft-types/{icaoCode}")]
    [ProducesResponseType<AircraftTypeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateType(string icaoCode, AircraftTypeRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await catalog.UpdateTypeAsync(icaoCode, request, cancellationToken), Ok);

    [HttpDelete("aircraft-types/{icaoCode}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteType(string icaoCode, CancellationToken cancellationToken) =>
        this.ToActionResult(await catalog.DeleteTypeAsync(icaoCode, cancellationToken), _ => NoContent());
}