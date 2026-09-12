using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using SkyBridge.Application.DTOs;
using Xunit;

namespace SkyBridge.Tests.Integration;

public class AuthFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthFlowTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Endpoint_protegido_sem_token_deve_retornar_401()
    {
        var response = await _client.PostAsJsonAsync("/api/Pireps", new NovoPirepDto(1, 1, 1, -100));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Registrar_e_logar_deve_permitir_acessar_endpoint_protegido()
    {
        var dto = new RegistroPilotoDto("Piloto Fluxo", "fluxo1@teste.com", "Senha@123");
        var registroResponse = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);
        var registro = await registroResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", registro!.Token);
        var pirepResponse = await _client.PostAsJsonAsync("/api/Pireps", new NovoPirepDto(1, 1, 1, -100));

        pirepResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Refresh_deve_bloquear_reuso_do_mesmo_token()
    {
        var dto = new RegistroPilotoDto("Piloto Refresh", "fluxo2@teste.com", "Senha@123");
        var registroResponse = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);
        var registro = await registroResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        var primeiroRefresh = await _client.PostAsJsonAsync("/api/Auth/refresh", new RefreshTokenDto(registro!.RefreshToken));
        primeiroRefresh.StatusCode.Should().Be(HttpStatusCode.OK);

        var segundoRefresh = await _client.PostAsJsonAsync("/api/Auth/refresh", new RefreshTokenDto(registro.RefreshToken));
        segundoRefresh.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_deve_invalidar_o_refresh_token()
    {
        var dto = new RegistroPilotoDto("Piloto Logout", "fluxo3@teste.com", "Senha@123");
        var registroResponse = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);
        var registro = await registroResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        await _client.PostAsJsonAsync("/api/Auth/logout", new RefreshTokenDto(registro!.RefreshToken));
        var refreshResponse = await _client.PostAsJsonAsync("/api/Auth/refresh", new RefreshTokenDto(registro.RefreshToken));

        refreshResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_com_senha_errada_deve_retornar_400()
    {
        var dto = new RegistroPilotoDto("Piloto Senha", "fluxo4@teste.com", "Senha@123");
        await _client.PostAsJsonAsync("/api/Auth/registrar", dto);

        var loginResponse = await _client.PostAsJsonAsync("/api/Auth/login", new LoginDto("fluxo4@teste.com", "SenhaErrada"));

        loginResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}