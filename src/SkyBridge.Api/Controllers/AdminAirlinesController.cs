using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Airlines;
using SkyBridge.Domain.Users;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize(Roles = $"{Roles.Admin},{Roles.Staff}")]
[Route("api/admin/airlines")]
public class AdminAirlinesController(IAirlineAdmin admin) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<AirlineDetailResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(AirlineRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await admin.CreateAsync(request, cancellationToken),
            airline => Created($"/api/airlines/{airline.Id}", airline));

    [HttpPut("{id:int}")]
    [ProducesResponseType<AirlineDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, AirlineRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await admin.UpdateAsync(id, request, cancellationToken), Ok);

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken) =>
        this.ToActionResult(await admin.DeleteAsync(id, cancellationToken), _ => NoContent());

    [HttpPut("{id:int}/fleet")]
    [ProducesResponseType<AirlineDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetFleet(int id, FleetRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await admin.SetFleetAsync(id, request, cancellationToken), Ok);

    [HttpPost("{id:int}/routes")]
    [ProducesResponseType<RouteResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddRoute(int id, RouteRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await admin.AddRouteAsync(id, request, cancellationToken),
            route => Created($"/api/airlines/{id}/routes", route));

    [HttpDelete("{id:int}/routes/{routeId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRoute(int id, int routeId, CancellationToken cancellationToken) =>
        this.ToActionResult(await admin.DeleteRouteAsync(id, routeId, cancellationToken), _ => NoContent());

    [HttpPost("import")]
    [ProducesResponseType<AirlineImportResult>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Import([FromServices] IAirlineSource source, [FromServices] IAirlineImporter importer, CancellationToken cancellationToken)
    {
        await using var airlines = await source.OpenAirlinesAsync(cancellationToken);
        await using var routes = await source.OpenRoutesAsync(cancellationToken);
        return Ok(await importer.ImportAsync(airlines, routes, cancellationToken));
    }
}