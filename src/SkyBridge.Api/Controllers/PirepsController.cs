using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PirepsController : ControllerBase
{
    private readonly IPirepService _pirepService;
    public PirepsController(IPirepService pirepService) => _pirepService = pirepService;

    [HttpPost]
    public async Task<IActionResult> Enviar(NovoPirepDto dto)
    {
        var pilotId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var resultado = await _pirepService.EnviarAsync(pilotId, dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpGet("pendentes")]
    public async Task<IActionResult> Pendentes()
    {
        var pendentes = await _pirepService.ListarPendentesAsync();
        return Ok(pendentes);
    }
}