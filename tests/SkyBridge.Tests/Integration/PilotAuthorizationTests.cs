using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using SkyBridge.Application.DTOs;
using Xunit;

namespace SkyBridge.Tests.Integration;

public class PilotAuthorizationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PilotAuthorizationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Nao_deve_deixar_iniciar_carreira_em_nome_de_outro_piloto()
    {
        var pilotoA = await RegistrarAsync("autha@teste.com");
        var pilotoB = await RegistrarAsync("authb@teste.com");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", pilotoA!.Token);
        var response = await _client.PostAsync($"/api/Pilots/{pilotoB!.Piloto.Id}/carreiras/1", null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Deve_permitir_iniciar_a_propria_carreira()
    {
        var piloto = await RegistrarAsync("authc@teste.com");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", piloto!.Token);
        var response = await _client.PostAsync($"/api/Pilots/{piloto.Piloto.Id}/carreiras/1", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Nao_deve_deixar_excluir_outro_piloto()
    {
        var pilotoA = await RegistrarAsync("authd@teste.com");
        var pilotoB = await RegistrarAsync("authe@teste.com");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", pilotoA!.Token);
        var response = await _client.DeleteAsync($"/api/Pilots/{pilotoB!.Piloto.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Listar_e_obter_piloto_devem_ser_publicos()
    {
        var piloto = await RegistrarAsync("authf@teste.com");
        _client.DefaultRequestHeaders.Authorization = null;

        var listaResponse = await _client.GetAsync("/api/Pilots");
        var detalheResponse = await _client.GetAsync($"/api/Pilots/{piloto!.Piloto.Id}");

        listaResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        detalheResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private async Task<AuthResponseDto?> RegistrarAsync(string email)
    {
        var dto = new RegistroPilotoDto("Piloto Teste", email, "Senha@123");
        var response = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);
        return await response.Content.ReadFromJsonAsync<AuthResponseDto>();
    }
}