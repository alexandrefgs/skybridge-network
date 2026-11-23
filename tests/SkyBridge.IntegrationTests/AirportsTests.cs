using System.Net;
using System.Net.Http.Json;
using SkyBridge.Application.Airports;
using SkyBridge.Application.Common;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class AirportsTests(SkyBridgeApiFactory factory)
{
    private const string ImportUrl = "/api/admin/airports/import";
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Import_Returns401_WhenAnonymous()
    {
        var response = await _client.PostAsync(ImportUrl, null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Import_Returns403_ForPilots()
    {
        var token = await _client.RegisterPilotAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, token);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Import_ImportsOnlyAirports_AndIsIdempotent()
    {
        var token = await _client.LoginAsAdminAsync();
        await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, token);

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, token);

        response.EnsureSuccessStatusCode();
        var result = (await response.Content.ReadFromJsonAsync<AirportCatalogImportResult>())!;
        Assert.Equal(new AirportImportResult(0, 0, 4, 4), result.Airports);
        Assert.Equal(new RunwayImportResult(0, 0, 0, 3), result.Runways);
    }

    [Fact]
    public async Task Runways_ListsOpenLandRunways_LongestFirst()
    {
        await EnsureImportedAsync();

        var runways = await GetAsPilotAsync<List<RunwayResponse>>("/api/airports/SBFL/runways");

        Assert.Equal(new[] { "14/32", "03/21" }, runways.Select(r => r.Name));
        Assert.Equal((7874, "Paved", true), (runways[0].LengthFt!.Value, runways[0].SurfaceType, runways[0].Lighted));
    }

    [Fact]
    public async Task Runways_SkipsWaterAndClosedRunways()
    {
        await EnsureImportedAsync();

        var runways = await GetAsPilotAsync<List<RunwayResponse>>("/api/airports/SSKT/runways");
        var airport = await GetAsPilotAsync<AirportResponse>("/api/airports/SSKT");

        var runway = Assert.Single(runways);
        Assert.Equal(("15/33", "Unpaved"), (runway.Name, runway.SurfaceType));
        Assert.Equal(2500, airport.LongestRunwayFt);
    }

    [Fact]
    public async Task Runways_Returns404_ForUnknownAirport()
    {
        var token = await _client.RegisterPilotAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/airports/ZZZZ/runways", token);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Search_Returns401_WhenAnonymous()
    {
        var response = await _client.GetAsync("/api/airports");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Search_FindsAirportByIataCode()
    {
        await EnsureImportedAsync();

        var result = await GetAsPilotAsync<PagedResult<AirportResponse>>("/api/airports?q=FLN");

        var airport = result.Items[0];
        Assert.Equal("SBFL", airport.Ident);
        Assert.Equal("Large", airport.Type);
        Assert.Equal("Florianópolis", airport.Municipality);
    }

    [Fact]
    public async Task Search_ByCountry_ListsLargeAirportsFirst()
    {
        await EnsureImportedAsync();

        var result = await GetAsPilotAsync<PagedResult<AirportResponse>>("/api/airports?country=br&pageSize=2");

        Assert.Equal(4, result.TotalCount);
        Assert.Equal(2, result.Items.Count);
        Assert.All(result.Items, airport => Assert.Equal("Large", airport.Type));
    }

    [Fact]
    public async Task Get_ReturnsAirport_WithMissingElevationAsNull()
    {
        await EnsureImportedAsync();

        var airport = await GetAsPilotAsync<AirportResponse>("/api/airports/SSKT");

        Assert.Equal("Small", airport.Type);
        Assert.Null(airport.ElevationFt);
    }

    [Fact]
    public async Task Get_Returns404_ForUnknownIdent()
    {
        var token = await _client.RegisterPilotAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/airports/ZZZZ", token);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task EnsureImportedAsync()
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, await _client.LoginAsAdminAsync());
        response.EnsureSuccessStatusCode();
    }

    private async Task<T> GetAsPilotAsync<T>(string url)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, url, await _client.RegisterPilotAsync());
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }
}