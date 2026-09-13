using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AirlinesController : ControllerBase
{
    private readonly IAirlineService _airlineService;
    public AirlinesController(IAirlineService airlineService) => _airlineService = airlineService;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var airlines = await _airlineService.ListarAsync();
        return Ok(airlines);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var airline = await _airlineService.ObterDetalheAsync(id);
        return airline is null ? NotFound() : Ok(airline);
    }

    [HttpGet("{id}/rotas")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRotas(int id)
    {
        var rotas = await _airlineService.ListarRotasAsync(id);
        return Ok(rotas);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Criar(NovaAirlineDto dto)
    {
        var airline = await _airlineService.CriarAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = airline.Id }, airline);
    }

    [HttpPost("{id}/aeronaves")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdicionarAeronave(int id, NovaAeronaveDto dto)
    {
        var resultado = await _airlineService.AdicionarAeronaveAsync(id, dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPost("{id}/rotas")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdicionarRota(int id, NovaRotaDto dto)
    {
        var resultado = await _airlineService.AdicionarRotaAsync(id, dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }
}