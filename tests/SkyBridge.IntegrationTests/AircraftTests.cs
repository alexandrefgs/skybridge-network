using System.Net;
using System.Net.Http.Json;
using SkyBridge.Application.Aircraft;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class AircraftTests(SkyBridgeApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetCategories_Returns401_WhenAnonymous()
    {
        var response = await _client.GetAsync("/api/aircraft-categories");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetCategories_ReturnsNineInProgressionOrder()
    {
        var categories = await GetAsPilotAsync<List<AircraftCategoryResponse>>("/api/aircraft-categories");

        Assert.Equal(
            new[] { "SinglePiston", "TwinPiston", "Turboprop", "Regional", "LightJet", "MidSizeJet", "LargeBusinessJet", "Medium", "Heavy" },
            categories.Select(c => c.Code));
        Assert.Equal(600, categories.Single(c => c.Code == "Heavy").RequiredHours);
    }

    [Fact]
    public async Task UpdateCategory_Returns403_ForPilots()
    {
        var token = await _client.RegisterPilotAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/admin/aircraft-categories/Heavy", token,
            new UpdateAircraftCategoryRequest("Heavy", 0));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCategory_AsAdmin_ChangesRequiredHours()
    {
        var token = await _client.LoginAsAdminAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/admin/aircraft-categories/MidSizeJet", token,
            new UpdateAircraftCategoryRequest("Mid-size jet", 160));

        response.EnsureSuccessStatusCode();
        var categories = await GetAsPilotAsync<List<AircraftCategoryResponse>>("/api/aircraft-categories");
        Assert.Equal(160, categories.Single(c => c.Code == "MidSizeJet").RequiredHours);

        await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/admin/aircraft-categories/MidSizeJet", token,
            new UpdateAircraftCategoryRequest("Mid-size jet", 150));
    }

    [Fact]
    public async Task GetTypes_ReturnsTheSeededCatalog()
    {
        var types = await GetAsPilotAsync<List<AircraftTypeResponse>>("/api/aircraft-types");

        Assert.True(types.Count >= 47);
    }

    [Fact]
    public async Task GetTypes_FiltersByCategory()
    {
        var types = await GetAsPilotAsync<List<AircraftTypeResponse>>("/api/aircraft-types?category=Heavy");

        Assert.All(types, t => Assert.Equal("Heavy", t.Category));
        Assert.Contains(types, t => t.IcaoCode == "B77W");
    }

    [Fact]
    public async Task GetTypes_SearchesByManufacturer()
    {
        var types = await GetAsPilotAsync<List<AircraftTypeResponse>>("/api/aircraft-types?q=Embraer");

        Assert.NotEmpty(types);
        Assert.All(types, t => Assert.Equal("Embraer", t.Manufacturer));
    }

    [Fact]
    public async Task GetType_Returns404_ForUnknownCode()
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/aircraft-types/ZZZZ", await _client.RegisterPilotAsync());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateType_AsAdmin_Returns201_WithNormalizedCode()
    {
        var token = await _client.LoginAsAdminAsync();
        var code = NewCode();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/aircraft-types", token, NewType(code.ToLowerInvariant()));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var type = await response.Content.ReadFromJsonAsync<AircraftTypeResponse>();
        Assert.Equal(code, type!.IcaoCode);
        Assert.Equal("Jet", type.EngineType);
    }

    [Fact]
    public async Task CreateType_Returns409_WhenCodeExists()
    {
        var token = await _client.LoginAsAdminAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/aircraft-types", token, NewType("B738"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task CreateType_Returns400_ForInvalidCode()
    {
        var token = await _client.LoginAsAdminAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/aircraft-types", token, NewType("B7380"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAndDeleteType_AsAdmin()
    {
        var token = await _client.LoginAsAdminAsync();
        var code = NewCode();
        await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/aircraft-types", token, NewType(code));

        var updated = await _client.SendAuthorizedAsync(HttpMethod.Put, $"/api/admin/aircraft-types/{code}", token, NewType(code) with { Seats = 99 });
        var deleted = await _client.SendAuthorizedAsync(HttpMethod.Delete, $"/api/admin/aircraft-types/{code}", token);
        var afterDelete = await _client.SendAuthorizedAsync(HttpMethod.Get, $"/api/aircraft-types/{code}", token);

        Assert.Equal(99, (await updated.Content.ReadFromJsonAsync<AircraftTypeResponse>())!.Seats);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, afterDelete.StatusCode);
    }

    private async Task<T> GetAsPilotAsync<T>(string url)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, url, await _client.RegisterPilotAsync());
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }

    private static string NewCode() => $"Z{Guid.NewGuid():N}"[..4].ToUpperInvariant();

    private static TypePayload NewType(string code) =>
        new(code, "Test Aircraft", "Prototype", "Medium", "Jet", 2, 3000, 450, 150, 4000);

    private sealed record TypePayload(
        string IcaoCode, string Manufacturer, string Model, string Category, string EngineType,
        int EngineCount, int RangeNm, int CruiseSpeedKts, int Seats, int MaxCargoKg);
}