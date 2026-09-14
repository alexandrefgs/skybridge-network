using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AwardsController : ControllerBase
{
    private readonly IAwardService _awardService;
    public AwardsController(IAwardService awardService) => _awardService = awardService;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var awards = await _awardService.ListarAsync();
        return Ok(awards);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var award = await _awardService.ObterDetalheAsync(id);
        return award is null ? NotFound() : Ok(award);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Criar(NovoAwardDto dto)
    {
        var award = await _awardService.CriarAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = award.Id }, award);
    }

    [HttpPut("{id}/imagem")]
    [Authorize]
    public async Task<IActionResult> DefinirImagem(int id, DefinirFotoDto dto)
    {
        var resultado = await _awardService.DefinirImagemAsync(id, dto.Url);
        return resultado.Sucesso ? Ok(resultado.Valor) : NotFound(resultado.Erro);
    }

        [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Atualizar(int id, NovoAwardDto dto)
    {
        var resultado = await _awardService.AtualizarAsync(id, dto);
        return resultado.Sucesso ? Ok(resultado.Valor) : NotFound(resultado.Erro);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Excluir(int id)
    {
        var resultado = await _awardService.ExcluirAsync(id);
        return resultado.Sucesso ? Ok(resultado.Valor) : NotFound(resultado.Erro);
    }
}