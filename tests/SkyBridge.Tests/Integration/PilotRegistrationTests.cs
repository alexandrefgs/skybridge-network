using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using SkyBridge.Application.DTOs;
using Xunit;

namespace SkyBridge.Tests.Integration;

public class PilotRegistrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PilotRegistrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Deve_gerar_callsigns_sequenciais_e_reaproveitar_numero_liberado()
    {
        var primeiro = await RegistrarAsync("piloto1@teste.com");
        primeiro!.Piloto.Callsign.Should().Be("SKB1001");

        var segundo = await RegistrarAsync("piloto2@teste.com");
        segundo!.Piloto.Callsign.Should().Be("SKB1002");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", segundo.Token);
        var deleteResponse = await _client.DeleteAsync($"/api/Pilots/{segundo.Piloto.Id}");
        deleteResponse.EnsureSuccessStatusCode();
        _client.DefaultRequestHeaders.Authorization = null;

        var terceiro = await RegistrarAsync("piloto3@teste.com");
        terceiro!.Piloto.Callsign.Should().Be("SKB1002");
    }

    private async Task<AuthResponseDto?> RegistrarAsync(string email)
    {
        var dto = new RegistroPilotoDto("Piloto Teste", email, "Senha@123");
        var response = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AuthResponseDto>();
    }
}