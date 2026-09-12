using System.Net;
using FluentAssertions;
using Xunit;

namespace SkyBridge.Tests.Integration;

public class AirlineFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AirlineFlowTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Listar_companhias_deve_ser_publico_e_retornar_seed()
    {
        var response = await _client.GetAsync("/api/Airlines");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var conteudo = await response.Content.ReadAsStringAsync();
        conteudo.Should().Contain("LATAM");
    }

    [Fact]
    public async Task Companhia_inexistente_deve_retornar_404()
    {
        var response = await _client.GetAsync("/api/Airlines/9999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Listar_rotas_de_uma_companhia_deve_ser_publico()
    {
        var response = await _client.GetAsync("/api/Airlines/1/rotas");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}