using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SkyBridge.Application.Airports;
using SkyBridge.Application.Auth;
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
        var email = $"{Guid.NewGuid():N}@skybridge.test";
        var register = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("Ana", "Silva", email, "Sky!Bridge2026"));
        var token = (await register.Content.ReadFromJsonAsync<LoginResponse>())!.AccessToken!;

        var response = await PostAuthorizedAsync(ImportUrl, token);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Import_ImportsOnlyAirports_AndIsIdempotent()
    {
        var token = await AdminTokenAsync();
        await PostAuthorizedAsync(ImportUrl, token);

        var response = await PostAuthorizedAsync(ImportUrl, token);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AirportImportResult>();
        Assert.Equal(new AirportImportResult(0, 0, 4, 4), result);
    }

    [Fact]
    public async Task Search_FindsAirportByIataCode()
    {
        await EnsureImportedAsync();

        var result = await _client.GetFromJsonAsync<PagedResult<AirportResponse>>("/api/airports?q=FLN");

        var airport = result!.Items[0];
        Assert.Equal("SBFL", airport.Ident);
        Assert.Equal("Large", airport.Type);
        Assert.Equal("Florianópolis", airport.Municipality);
    }

    [Fact]
    public async Task Search_ByCountry_ListsLargeAirportsFirst()
    {
        await EnsureImportedAsync();

        var result = await _client.GetFromJsonAsync<PagedResult<AirportResponse>>("/api/airports?country=br&pageSize=2");

        Assert.Equal(4, result!.TotalCount);
        Assert.Equal(2, result.Items.Count);
        Assert.All(result.Items, airport => Assert.Equal("Large", airport.Type));
    }

    [Fact]
    public async Task Get_ReturnsAirport_WithMissingElevationAsNull()
    {
        await EnsureImportedAsync();

        var airport = await _client.GetFromJsonAsync<AirportResponse>("/api/airports/SSKT");

        Assert.Equal("Small", airport!.Type);
        Assert.Null(airport.ElevationFt);
    }

    [Fact]
    public async Task Get_Returns404_ForUnknownIdent()
    {
        var response = await _client.GetAsync("/api/airports/ZZZZ");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task EnsureImportedAsync()
    {
        var response = await PostAuthorizedAsync(ImportUrl, await AdminTokenAsync());
        response.EnsureSuccessStatusCode();
    }

    private async Task<string> AdminTokenAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(SkyBridgeApiFactory.AdminEmail, SkyBridgeApiFactory.AdminPassword));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<LoginResponse>())!.AccessToken!;
    }

    private async Task<HttpResponseMessage> PostAuthorizedAsync(string url, string token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await _client.SendAsync(request);
    }
}