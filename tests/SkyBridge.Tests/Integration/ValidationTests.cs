using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using SkyBridge.Application.DTOs;
using Xunit;

namespace SkyBridge.Tests.Integration;

public class ValidationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ValidationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Registrar_com_senha_curta_deve_retornar_400()
    {
        var dto = new RegistroPilotoDto("Piloto Validação", "valid1@teste.com", "123");

        var response = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Registrar_com_email_invalido_deve_retornar_400()
    {
        var dto = new RegistroPilotoDto("Piloto Validação", "email-invalido", "Senha@123");

        var response = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Registrar_com_nome_vazio_deve_retornar_400()
    {
        var dto = new RegistroPilotoDto("", "valid2@teste.com", "Senha@123");

        var response = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Registrar_com_dados_validos_deve_retornar_200()
    {
        var dto = new RegistroPilotoDto("Piloto Válido", "valid3@teste.com", "Senha@123");

        var response = await _client.PostAsJsonAsync("/api/Auth/registrar", dto);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}