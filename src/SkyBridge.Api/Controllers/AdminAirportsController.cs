using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Airports;
using SkyBridge.Domain.Users;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize(Roles = $"{Roles.Admin},{Roles.Staff}")]
[Route("api/admin/airports")]
public class AdminAirportsController(IAirportSource source, IAirportImporter importer) : ControllerBase
{
    [HttpPost("import")]
    [ProducesResponseType<AirportImportResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Import(CancellationToken cancellationToken)
    {
        await using var csv = await source.OpenAirportsCsvAsync(cancellationToken);
        return Ok(await importer.ImportAsync(csv, cancellationToken));
    }
}