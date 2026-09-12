using FluentAssertions;
using NSubstitute;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Services;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using Xunit;

namespace SkyBridge.Tests.Application;

public class AuthServiceTests
{
    private readonly IUnitOfWork _uow;
    private readonly ITokenService _tokenService;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        _uow = Substitute.For<IUnitOfWork>();
        _uow.Pilots.Returns(Substitute.For<IPilotRepository>());
        _uow.RefreshTokens.Returns(Substitute.For<IRefreshTokenRepository>());

        _tokenService = Substitute.For<ITokenService>();
        _tokenService.GerarAccessToken(Arg.Any<Pilot>()).Returns(("token-fake", DateTime.UtcNow.AddMinutes(30)));

        _service = new AuthService(_uow, _tokenService);
    }

    [Fact]
    public async Task RegistrarAsync_deve_falhar_se_email_ja_existe()
    {
        _uow.Pilots.GetByEmailAsync("teste@teste.com").Returns(new Pilot());

        var resultado = await _service.RegistrarAsync(new RegistroPilotoDto("Nome", "teste@teste.com", "Senha@123"));

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task RegistrarAsync_deve_gerar_callsign_com_numero_retornado_pelo_repositorio()
    {
        _uow.Pilots.GetByEmailAsync(Arg.Any<string>()).Returns((Pilot?)null);
        _uow.Pilots.GetProximoNumeroCallsignAsync().Returns(1005);

        Pilot? pilotCriado = null;
        _uow.Pilots.AddAsync(Arg.Do<Pilot>(p => pilotCriado = p)).Returns(Task.CompletedTask);

        var resultado = await _service.RegistrarAsync(new RegistroPilotoDto("Nome", "novo@teste.com", "Senha@123"));

        resultado.Sucesso.Should().BeTrue();
        pilotCriado!.Callsign.Should().Be("SKB1005");
    }

    [Fact]
    public async Task LoginAsync_deve_falhar_com_email_inexistente()
    {
        _uow.Pilots.GetByEmailAsync(Arg.Any<string>()).Returns((Pilot?)null);

        var resultado = await _service.LoginAsync(new LoginDto("naoexiste@teste.com", "senha"));

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task LoginAsync_deve_falhar_com_senha_incorreta()
    {
        var pilot = new Pilot { Email = "teste@teste.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("SenhaCorreta") };
        _uow.Pilots.GetByEmailAsync("teste@teste.com").Returns(pilot);

        var resultado = await _service.LoginAsync(new LoginDto("teste@teste.com", "SenhaErrada"));

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task LoginAsync_deve_ter_sucesso_com_credenciais_corretas()
    {
        var pilot = new Pilot { Id = 1, Email = "teste@teste.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Senha@123") };
        _uow.Pilots.GetByEmailAsync("teste@teste.com").Returns(pilot);

        var resultado = await _service.LoginAsync(new LoginDto("teste@teste.com", "Senha@123"));

        resultado.Sucesso.Should().BeTrue();
    }

    [Fact]
    public async Task RefreshAsync_deve_falhar_se_token_nao_existe()
    {
        _uow.RefreshTokens.GetByTokenHashAsync(Arg.Any<string>()).Returns((RefreshToken?)null);

        var resultado = await _service.RefreshAsync(new RefreshTokenDto("token-invalido"));

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task RefreshAsync_deve_falhar_se_token_ja_foi_revogado()
    {
        var token = new RefreshToken { ExpiraEm = DateTime.UtcNow.AddDays(1), Pilot = new Pilot() };
        token.Revogar();
        _uow.RefreshTokens.GetByTokenHashAsync(Arg.Any<string>()).Returns(token);

        var resultado = await _service.RefreshAsync(new RefreshTokenDto("token-usado"));

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task RefreshAsync_deve_revogar_o_token_antigo_ao_gerar_um_novo()
    {
        var token = new RefreshToken { ExpiraEm = DateTime.UtcNow.AddDays(1), Pilot = new Pilot { Id = 1 } };
        _uow.RefreshTokens.GetByTokenHashAsync(Arg.Any<string>()).Returns(token);

        var resultado = await _service.RefreshAsync(new RefreshTokenDto("token-valido"));

        resultado.Sucesso.Should().BeTrue();
        token.EstaAtivo.Should().BeFalse();
    }

    [Fact]
    public async Task LogoutAsync_deve_revogar_token_ativo()
    {
        var token = new RefreshToken { ExpiraEm = DateTime.UtcNow.AddDays(1) };
        _uow.RefreshTokens.GetByTokenHashAsync(Arg.Any<string>()).Returns(token);

        await _service.LogoutAsync(new RefreshTokenDto("token-valido"));

        token.EstaAtivo.Should().BeFalse();
    }
}