using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Airports;
using SkyBridge.Domain.Users;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize(Roles = $"{Roles.Admin},{Roles.Staff}")]
[Route("api/admin/airports")]
public class AdminAirportsController(IAirportSource source, IAirportImporter airports, IRunwayImporter runways) : ControllerBase
{
    [HttpPost("import")]
    [ProducesResponseType<AirportCatalogImportResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Import(CancellationToken cancellationToken)
    {
        AirportImportResult airportResult;
        await using (var csv = await source.OpenAirportsCsvAsync(cancellationToken))
            airportResult = await airports.ImportAsync(csv, cancellationToken);

        await using var runwaysCsv = await source.OpenRunwaysCsvAsync(cancellationToken);
        var runwayResult = await runways.ImportAsync(runwaysCsv, cancellationToken);

        return Ok(new AirportCatalogImportResult(airportResult, runwayResult));
    }
}