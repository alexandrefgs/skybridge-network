using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PilotsController : ControllerBase
{
    private readonly IPilotService _pilotService;
    public PilotsController(IPilotService pilotService) => _pilotService = pilotService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var pilots = await _pilotService.ListarAsync();
        return Ok(pilots);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var pilot = await _pilotService.ObterDetalheAsync(id);
        return pilot is null ? NotFound() : Ok(pilot);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(NovoPilotoDto dto)
    {
        var pilot = await _pilotService.CriarAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = pilot.Id }, pilot);
    }

    [HttpPost("{pilotId}/carreiras/{airlineId}")]
    public async Task<IActionResult> IniciarCarreira(int pilotId, int airlineId)
    {
        var resultado = await _pilotService.IniciarCarreiraAsync(pilotId, airlineId);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }
}