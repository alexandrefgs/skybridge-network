using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PilotsController : ControllerBase
{
    private readonly IPilotService _pilotService;
    public PilotsController(IPilotService pilotService) => _pilotService = pilotService;

    public record SimBriefUsernameDto(string SimBriefUsername);
    public record LocalizacaoDto(string AeroportoIcao);

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var pilots = await _pilotService.ListarAsync();
        return Ok(pilots);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var pilot = await _pilotService.ObterDetalheAsync(id);
        return pilot is null ? NotFound() : Ok(pilot);
    }

    [HttpPost("{pilotId}/carreiras/{airlineId}")]
    [Authorize]
    public async Task<IActionResult> IniciarCarreira(int pilotId, int airlineId)
    {
        var idLogado = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (pilotId != idLogado)
            return Forbid();

        var resultado = await _pilotService.IniciarCarreiraAsync(pilotId, airlineId);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPut("{pilotId}/simbrief-username")]
    [Authorize]
    public async Task<IActionResult> DefinirSimBriefUsername(int pilotId, SimBriefUsernameDto dto)
    {
        var idLogado = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (pilotId != idLogado)
            return Forbid();

        var resultado = await _pilotService.DefinirSimBriefUsernameAsync(pilotId, dto.SimBriefUsername);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPut("{pilotId}/localizacao")]
    [Authorize]
    public async Task<IActionResult> DefinirLocalizacao(int pilotId, LocalizacaoDto dto)
    {
        var idLogado = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (pilotId != idLogado)
            return Forbid();

        var resultado = await _pilotService.DefinirLocalizacaoAsync(pilotId, dto.AeroportoIcao);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Excluir(int id)
    {
        var idLogado = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id != idLogado)
            return Forbid();

        var resultado = await _pilotService.ExcluirAsync(id);
        return resultado.Sucesso ? Ok(resultado.Valor) : NotFound(resultado.Erro);
    }

    [HttpPut("{id}/inativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Inativar(int id)
    {
        var resultado = await _pilotService.InativarAsync(id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPut("{id}/reativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reativar(int id)
    {
        var resultado = await _pilotService.ReativarAsync(id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPut("{id}/promover-admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PromoverAdmin(int id)
    {
        var resultado = await _pilotService.PromoverAdminAsync(id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }
}