using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

public record RejeitarPirepDto(string Motivo);

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

    [HttpGet("ultimos")]
    [AllowAnonymous]
    public async Task<IActionResult> Ultimos([FromQuery] int quantidade = 10)
    {
        var ultimos = await _pirepService.ListarUltimosAsync(quantidade);
        return Ok(ultimos);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> ObterDetalhe(int id)
    {
        var detalhe = await _pirepService.ObterDetalheAsync(id);
        return detalhe is null ? NotFound() : Ok(detalhe);
    }

    [HttpPost("{id}/aprovar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Aprovar(int id)
    {
        var resultado = await _pirepService.AprovarAsync(id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPost("{id}/rejeitar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Rejeitar(int id, RejeitarPirepDto dto)
    {
        var resultado = await _pirepService.RejeitarAsync(id, dto.Motivo);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpGet("{id}/telemetria")]
    [Authorize]
    public async Task<IActionResult> ObterTelemetria(int id)
    {
        var solicitanteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var ehAdmin = User.IsInRole("Admin");
        var logs = await _pirepService.ObterTelemetriaAsync(id, solicitanteId, ehAdmin);
        return logs is null ? NotFound() : Ok(logs);
    }
}