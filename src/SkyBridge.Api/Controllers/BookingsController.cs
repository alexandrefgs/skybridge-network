using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    public BookingsController(IBookingService bookingService) => _bookingService = bookingService;

    private int PilotIdLogado => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> ListarMeus()
    {
        var bookings = await _bookingService.ListarMeusAsync(PilotIdLogado);
        return Ok(bookings);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterDetalhe(int id)
    {
        var booking = await _bookingService.ObterDetalheAsync(PilotIdLogado, id);
        return booking is null ? NotFound() : Ok(booking);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(NovoBookingDto dto)
    {
        var resultado = await _bookingService.CriarAsync(PilotIdLogado, dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPut("{id}/alternados")]
    public async Task<IActionResult> DefinirAlternados(int id, AlternadosDto dto)
    {
        var resultado = await _bookingService.DefinirAlternadosAsync(PilotIdLogado, id, dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPut("{id}/perfil-simbrief")]
    public async Task<IActionResult> DefinirPerfilSimBrief(int id, PerfilSimBriefDto dto)
    {
        var resultado = await _bookingService.DefinirPerfilSimBriefAsync(PilotIdLogado, id, dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPut("{id}/payload")]
    public async Task<IActionResult> DefinirPayload(int id, PayloadDto dto)
    {
        var resultado = await _bookingService.DefinirPayloadAsync(PilotIdLogado, id, dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpGet("{id}/simbrief-redirect")]
    public async Task<IActionResult> ObterRedirectSimBrief(int id)
    {
        var resultado = await _bookingService.ObterRedirectSimBriefAsync(PilotIdLogado, id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPost("{id}/confirmar-ofp")]
    public async Task<IActionResult> ConfirmarOfp(int id)
    {
        var resultado = await _bookingService.ConfirmarOfpAsync(PilotIdLogado, id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPost("{id}/iniciar-voo")]
    public async Task<IActionResult> IniciarVoo(int id)
    {
        var resultado = await _bookingService.IniciarVooAsync(PilotIdLogado, id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpGet("{id}/status-voo")]
    public async Task<IActionResult> ObterStatusVoo(int id)
    {
        var resultado = await _bookingService.ObterStatusVooAsync(PilotIdLogado, id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpPost("{id}/enviar-pirep")]
    public async Task<IActionResult> EnviarPirep(int id)
    {
        var resultado = await _bookingService.EnviarPirepAsync(PilotIdLogado, id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }
}