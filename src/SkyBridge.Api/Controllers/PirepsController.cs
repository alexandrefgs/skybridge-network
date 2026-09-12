using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PirepsController : ControllerBase
{
    private readonly IPirepService _pirepService;
    public PirepsController(IPirepService pirepService) => _pirepService = pirepService;

    [HttpPost]
    public async Task<IActionResult> Enviar(NovoPirepDto dto)
    {
        var resultado = await _pirepService.EnviarAsync(dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpGet("pendentes")]
    public async Task<IActionResult> Pendentes()
    {
        var pendentes = await _pirepService.ListarPendentesAsync();
        return Ok(pendentes);
    }
}