using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SkyBridge.Api.Controllers;

public record UploadResultDto(string Url);

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UploadsController : ControllerBase
{
    private static readonly string[] ExtensoesPermitidas = [".jpg", ".jpeg", ".png", ".webp"];
    private const long TamanhoMaximoBytes = 5 * 1024 * 1024;

    private readonly IWebHostEnvironment _env;
    public UploadsController(IWebHostEnvironment env) => _env = env;

    [HttpPost("imagem")]
    public async Task<IActionResult> UploadImagem(IFormFile arquivo)
    {
        if (arquivo is null || arquivo.Length == 0)
            return BadRequest("Nenhum arquivo enviado.");

        if (arquivo.Length > TamanhoMaximoBytes)
            return BadRequest("Arquivo muito grande. Máximo de 5MB.");

        var extensao = Path.GetExtension(arquivo.FileName).ToLowerInvariant();
        if (!ExtensoesPermitidas.Contains(extensao))
            return BadRequest("Formato não suportado. Use JPG, PNG ou WEBP.");

        var pastaUploads = Path.Combine(_env.WebRootPath, "uploads");
        Directory.CreateDirectory(pastaUploads);

        var nomeArquivo = $"{Guid.NewGuid()}{extensao}";
        var caminhoCompleto = Path.Combine(pastaUploads, nomeArquivo);

        using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
        {
            await arquivo.CopyToAsync(stream);
        }

        var url = $"{Request.Scheme}://{Request.Host}/uploads/{nomeArquivo}";
        return Ok(new UploadResultDto(url));
    }
}