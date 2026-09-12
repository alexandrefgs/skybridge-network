namespace SkyBridge.Application.DTOs;

public record RegistroPilotoDto(string Nome, string Email, string Senha);

public record LoginDto(string Email, string Senha);

public record RefreshTokenDto(string RefreshToken);

public record AuthResponseDto(string Token, DateTime ExpiraEm, string RefreshToken, PilotoResumoDto Piloto);