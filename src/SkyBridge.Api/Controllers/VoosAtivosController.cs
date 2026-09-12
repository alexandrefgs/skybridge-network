using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VoosAtivosController : ControllerBase
{
    private readonly IVooAtivoService _vooAtivoService;
    public VoosAtivosController(IVooAtivoService vooAtivoService) => _vooAtivoService = vooAtivoService;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var ativos = await _vooAtivoService.ListarAtivosAsync();
        return Ok(ativos);
    }

    [HttpPost("telemetria")]
    [Authorize]
    public async Task<IActionResult> Telemetria(TelemetriaDto dto)
    {
        var pilotId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _vooAtivoService.AtualizarAsync(pilotId, dto);
        return NoContent();
    }
}