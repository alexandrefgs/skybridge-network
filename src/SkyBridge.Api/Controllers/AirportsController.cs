using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AirportsController : ControllerBase
{
    private readonly IAirportService _airportService;
    public AirportsController(IAirportService airportService) => _airportService = airportService;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var aeroportos = await _airportService.ListarAsync();
        return Ok(aeroportos);
    }

    [HttpGet("{icao}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObterPorIcao(string icao)
    {
        var aeroporto = await _airportService.ObterPorIcaoAsync(icao);
        return aeroporto is null ? NotFound() : Ok(aeroporto);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Criar(NovoAirportDto dto)
    {
        var resultado = await _airportService.CriarAsync(dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }
}