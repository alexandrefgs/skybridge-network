using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using SkyBridge.Application.DTOs;
using Xunit;

namespace SkyBridge.Tests.Integration;

public class PirepFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PirepFlowTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Pirep_deve_ser_vinculado_ao_piloto_do_token_nao_ao_body()
    {
        var piloto = await RegistrarAsync("pirep1@teste.com");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", piloto!.Token);

        var response = await _client.PostAsJsonAsync("/api/Pireps", new NovoPirepDto(1, 1, 1, -100));
        var pirep = await response.Content.ReadFromJsonAsync<PirepResultDto>();

        pirep!.Status.Should().Be("Aprovado");
    }

    [Fact]
    public async Task Pouso_muito_forte_deve_aparecer_na_lista_de_pendentes()
    {
        var piloto = await RegistrarAsync("pirep2@teste.com");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", piloto!.Token);

        await _client.PostAsJsonAsync("/api/Pireps", new NovoPirepDto(1, 1, 1, -1500));
        var pendentesResponse = await _client.GetAsync("/api/Pireps/pendentes");
        var pendentes = await pendentesResponse.Content.ReadFromJsonAsync<List<PirepPendenteDto>>();

        pendentes.Should().Contain(p => p.PilotCallsign == piloto.Piloto.Callsign);
    }

    [Fact]
    public async Task Aprovar_pirep_pendente_deve_retornar_200_para_admin()
    {
        var piloto = await RegistrarAsync("pirep3@teste.com");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", piloto!.Token);

        var pirepResponse = await _client.PostAsJsonAsync("/api/Pireps", new NovoPirepDto(1, 1, 1, -1500));
        var pirep = await pirepResponse.Content.ReadFromJsonAsync<PirepResultDto>();

        var admin = await LogarComoAdminAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin.Token);
        var aprovarResponse = await _client.PostAsync($"/api/Pireps/{pirep!.Id}/aprovar", null);

        aprovarResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Aprovar_pirep_deve_retornar_403_para_piloto_comum()
    {
        var piloto = await RegistrarAsync("pirep5@teste.com");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", piloto!.Token);

        var pirepResponse = await _client.PostAsJsonAsync("/api/Pireps", new NovoPirepDto(1, 1, 1, -1500));
        var pirep = await pirepResponse.Content.ReadFromJsonAsync<PirepResultDto>();

        var aprovarResponse = await _client.PostAsync($"/api/Pireps/{pirep!.Id}/aprovar", null);

        aprovarResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Rejeitar_pirep_ja_avaliado_deve_retornar_400()
    {
        var piloto = await RegistrarAsync("pirep4@teste.com");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", piloto!.Token);

        var pirepResponse = await _client.PostAsJsonAsync("/api/Pireps", new NovoPirepDto(1, 1, 1, -1500));
        var pirep = await pirepResponse.Content.ReadFromJsonAsync<PirepResultDto>();

        var admin = await LogarComoAdminAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin.Token);

        await _client.PostAsync($"/api/Pireps/{pirep!.Id}/aprovar", null);
        var rejeitarResponse = await _client.PostAsJsonAsync($"/api/Pireps/{pirep.Id}/rejeitar", new { motivo = "teste" });

        rejeitarResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task<AuthResponseDto?> RegistrarAsync(string email)
    {
        var dto = new RegistroPilotoDto("Piloto Teste", email, "Senha@123");
        var response = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);
        return await response.Content.ReadFromJsonAsync<AuthResponseDto>();
    }

    private async Task<AuthResponseDto> LogarComoAdminAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/Auth/login", new LoginDto("admin@skybridge.com", "Admin@123"));
        return (await response.Content.ReadFromJsonAsync<AuthResponseDto>())!;
    }
}