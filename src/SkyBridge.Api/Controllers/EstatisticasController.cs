using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Interfaces;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EstatisticasController : ControllerBase
{
    private readonly IEstatisticasService _estatisticasService;
    public EstatisticasController(IEstatisticasService estatisticasService) => _estatisticasService = estatisticasService;

    [HttpGet]
    public async Task<IActionResult> Obter()
    {
        var ehAdmin = User.IsInRole("Admin");
        var estatisticas = await _estatisticasService.ObterAsync(ehAdmin);
        return Ok(estatisticas);
    }
}