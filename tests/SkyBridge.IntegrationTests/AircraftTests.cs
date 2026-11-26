using System.Net;
using System.Net.Http.Json;
using SkyBridge.Application.Aircraft;
using SkyBridge.Application.Common;
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
            new UpdateAircraftCategoryRequest("Heavy", 0, 0));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCategory_AsAdmin_ChangesRequiredHours()
    {
        var token = await _client.LoginAsAdminAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/admin/aircraft-categories/MidSizeJet", token,
            new UpdateAircraftCategoryRequest("Mid-size jet", 160, 240));

        response.EnsureSuccessStatusCode();
        var categories = await GetAsPilotAsync<List<AircraftCategoryResponse>>("/api/aircraft-categories");
                var midSize = categories.Single(c => c.Code == "MidSizeJet");
        Assert.Equal((160, 240), (midSize.RequiredHours, midSize.PayPerHour));

        await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/admin/aircraft-categories/MidSizeJet", token,
            new UpdateAircraftCategoryRequest("Mid-size jet", 150, 220));
    }

    [Fact]
    public async Task GetTypes_ReturnsTheSeededCatalog()
    {
        var result = await GetAsPilotAsync<PagedResult<AircraftTypeResponse>>("/api/aircraft-types");

        Assert.True(result.TotalCount >= 47);
        Assert.Equal(20, result.Items.Count);
    }

    [Fact]
    public async Task GetTypes_PagesWithinTheFilteredResults()
    {
        var result = await GetAsPilotAsync<PagedResult<AircraftTypeResponse>>("/api/aircraft-types?category=Heavy&page=2&pageSize=5");

        Assert.Equal(9, result.TotalCount);
        Assert.Equal(2, result.Page);
        Assert.Equal(4, result.Items.Count);
        Assert.All(result.Items, t => Assert.Equal("Heavy", t.Category));
    }

    [Fact]
    public async Task GetTypes_FiltersByCategory()
    {
        var types = (await GetAsPilotAsync<PagedResult<AircraftTypeResponse>>("/api/aircraft-types?category=Heavy")).Items;

        Assert.All(types, t => Assert.Equal("Heavy", t.Category));
        Assert.Contains(types, t => t.IcaoCode == "B77W");
        Assert.All(types, t => Assert.True(t.ServiceCeilingFt > 0));
        Assert.All(types, t => Assert.True(t.MinRunwayFt >= 6000 && t.RequiresPavedRunway));
    }
    
    [Fact]
    public async Task GetTypes_SearchesByFamily()
    {
        var types = (await GetAsPilotAsync<PagedResult<AircraftTypeResponse>>("/api/aircraft-types?q=Boeing 737")).Items;

        Assert.Equal(new[] { "B38M", "B737", "B738", "B739" }, types.Select(t => t.IcaoCode).Order(StringComparer.Ordinal));
        Assert.All(types, t => Assert.Equal("Boeing 737", t.Family));
    }

    [Fact]
    public async Task GetTypes_SearchesByManufacturer()
    {
        var types = (await GetAsPilotAsync<PagedResult<AircraftTypeResponse>>("/api/aircraft-types?q=Embraer")).Items;

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
        Assert.Equal(41000, type.ServiceCeilingFt);
        Assert.Equal((5000, true), (type.MinRunwayFt, type.RequiresPavedRunway));
        Assert.Null(type.Family);
    }

    [Fact]
    public async Task CreateType_StoresTheFamily()
    {
        var token = await _client.LoginAsAdminAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/aircraft-types", token,
            NewType(NewCode()) with { Family = "  Test Family  " });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("Test Family", (await response.Content.ReadFromJsonAsync<AircraftTypeResponse>())!.Family);
    }

    [Fact]
    public async Task CreateType_Returns400_WithMinRunwayOutOfRange()
    {
        var token = await _client.LoginAsAdminAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/aircraft-types", token, NewType(NewCode()) with { MinRunwayFt = 100 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateType_Returns400_WithoutServiceCeiling()
    {
        var token = await _client.LoginAsAdminAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/aircraft-types", token, NewType(NewCode()) with { ServiceCeilingFt = 0 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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
        new(code, "Test Aircraft", "Prototype", "Medium", "Jet", 2, 3000, 450, 41000, 150, 4000, 5000, true);

    private sealed record TypePayload(
        string IcaoCode, string Manufacturer, string Model, string Category, string EngineType,
        int EngineCount, int RangeNm, int CruiseSpeedKts, int ServiceCeilingFt, int Seats, int MaxCargoKg,
        int MinRunwayFt, bool RequiresPavedRunway, string? Family = null);
}