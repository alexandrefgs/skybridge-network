using System.Security.Cryptography;
using System.Text;
using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class AuthService : IAuthService
{
    private const int RefreshTokenDiasValidade = 7;

    private readonly IUnitOfWork _uow;
    private readonly ITokenService _tokenService;

    public AuthService(IUnitOfWork uow, ITokenService tokenService)
    {
        _uow = uow;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponseDto>> RegistrarAsync(RegistroPilotoDto dto)
    {
        var existente = await _uow.Pilots.GetByEmailAsync(dto.Email);
        if (existente is not null)
            return Result<AuthResponseDto>.Falha("Já existe um piloto cadastrado com esse e-mail.");

        var numero = await _uow.Pilots.GetProximoNumeroCallsignAsync();

        var pilot = new Pilot
        {
            Nome = dto.Nome,
            Callsign = $"SKB{numero:D4}",
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
            Rating = 3.0,
            PontosTotais = 0
        };

        await _uow.Pilots.AddAsync(pilot);
        await _uow.SaveChangesAsync();

        return await GerarRespostaAutenticacaoAsync(pilot);
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var pilot = await _uow.Pilots.GetByEmailAsync(dto.Email);
        if (pilot is null || !BCrypt.Net.BCrypt.Verify(dto.Senha, pilot.PasswordHash))
            return Result<AuthResponseDto>.Falha("E-mail ou senha inválidos.");

        return await GerarRespostaAutenticacaoAsync(pilot);
    }

    public async Task<Result<AuthResponseDto>> RefreshAsync(RefreshTokenDto dto)
    {
        var hash = HashToken(dto.RefreshToken);
        var tokenSalvo = await _uow.RefreshTokens.GetByTokenHashAsync(hash);

        if (tokenSalvo is null || !tokenSalvo.EstaAtivo || tokenSalvo.Pilot is null)
            return Result<AuthResponseDto>.Falha("Refresh token inválido ou expirado.");

        // Rotação: o token usado é revogado e nunca mais pode ser reaproveitado
        tokenSalvo.Revogar();

        return await GerarRespostaAutenticacaoAsync(tokenSalvo.Pilot);
    }

    public async Task LogoutAsync(RefreshTokenDto dto)
    {
        var hash = HashToken(dto.RefreshToken);
        var tokenSalvo = await _uow.RefreshTokens.GetByTokenHashAsync(hash);

        if (tokenSalvo is not null && tokenSalvo.EstaAtivo)
        {
            tokenSalvo.Revogar();
            await _uow.SaveChangesAsync();
        }
    }

    private async Task<Result<AuthResponseDto>> GerarRespostaAutenticacaoAsync(Pilot pilot)
    {
        var (accessToken, expiraEm) = _tokenService.GerarAccessToken(pilot);
        var refreshTokenTexto = GerarRefreshTokenTexto();

        var refreshToken = new RefreshToken
        {
            PilotId = pilot.Id,
            TokenHash = HashToken(refreshTokenTexto),
            ExpiraEm = DateTime.UtcNow.AddDays(RefreshTokenDiasValidade)
        };

        await _uow.RefreshTokens.AddAsync(refreshToken);
        await _uow.SaveChangesAsync();

                var pilotoDto = new PilotoResumoDto(pilot.Id, pilot.Nome, pilot.Callsign, pilot.Rating, pilot.PontosTotais, pilot.LocalizacaoAtualIcao);

        return Result<AuthResponseDto>.Ok(new AuthResponseDto(accessToken, expiraEm, refreshTokenTexto, pilotoDto));
    }

    private static string GerarRefreshTokenTexto() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}