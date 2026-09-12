using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AirlinesController : ControllerBase
{
    private readonly IAirlineService _airlineService;
    public AirlinesController(IAirlineService airlineService) => _airlineService = airlineService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var airlines = await _airlineService.ListarAsync();
        return Ok(airlines);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var airline = await _airlineService.ObterDetalheAsync(id);
        return airline is null ? NotFound() : Ok(airline);
    }

    [HttpGet("{id}/rotas")]
    public async Task<IActionResult> GetRotas(int id)
    {
        var rotas = await _airlineService.ListarRotasAsync(id);
        return Ok(rotas);
    }
}