using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WeatherController : ControllerBase
{
    private readonly IWeatherClient _weatherClient;
    public WeatherController(IWeatherClient weatherClient) => _weatherClient = weatherClient;

    [HttpGet("metar/{icao}")]
    public async Task<IActionResult> ObterMetar(string icao)
    {
        var metar = await _weatherClient.ObterMetarAsync(icao);
        return metar is null ? NotFound() : Ok(metar);
    }

    [HttpGet("taf/{icao}")]
    public async Task<IActionResult> ObterTaf(string icao)
    {
        var taf = await _weatherClient.ObterTafAsync(icao);
        return taf is null ? NotFound() : Ok(taf);
    }
}