namespace SkyBridge.Application.DTOs;

public record NovoAwardDto(string Nome, string? Descricao);

public record AwardDto(int Id, string Nome, string? Descricao, string? ImagemUrl);