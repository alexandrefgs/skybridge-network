using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToursController : ControllerBase
{
    private readonly ITourService _tourService;
    public ToursController(ITourService tourService) => _tourService = tourService;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var tours = await _tourService.ListarAsync();
        return Ok(tours);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var tour = await _tourService.ObterDetalheAsync(id);
        return tour is null ? NotFound() : Ok(tour);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Criar(NovoTourDto dto)
    {
        var tour = await _tourService.CriarAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = tour.Id }, tour);
    }

    [HttpPut("{id}/foto")]
    [Authorize]
    public async Task<IActionResult> DefinirFoto(int id, DefinirFotoDto dto)
    {
        var resultado = await _tourService.DefinirFotoAsync(id, dto.Url);
        return resultado.Sucesso ? Ok(resultado.Valor) : NotFound(resultado.Erro);
    }

    [HttpPut("{id}/foto-capa")]
    [Authorize]
    public async Task<IActionResult> DefinirFotoCapa(int id, DefinirFotoDto dto)
    {
        var resultado = await _tourService.DefinirFotoCapaAsync(id, dto.Url);
        return resultado.Sucesso ? Ok(resultado.Valor) : NotFound(resultado.Erro);
    }

    [HttpPost("{id}/iniciar")]
    [Authorize]
    public async Task<IActionResult> Iniciar(int id)
    {
        var pilotId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var resultado = await _tourService.IniciarAsync(pilotId, id);
        return resultado.Sucesso ? Ok(resultado.Valor) : BadRequest(resultado.Erro);
    }

    [HttpGet("meu-progresso")]
    [Authorize]
    public async Task<IActionResult> MeuProgresso()
    {
        var pilotId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var progresso = await _tourService.ListarProgressoDoPilotoAsync(pilotId);
        return Ok(progresso);
    }
}