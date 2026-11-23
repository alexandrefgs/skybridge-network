using System.Net;
using System.Net.Http.Json;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Common;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class AirlinesTests(SkyBridgeApiFactory factory)
{
    private const string ImportUrl = "/api/admin/airlines/import";
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Search_Returns401_WhenAnonymous()
    {
        var response = await _client.GetAsync("/api/airlines");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Import_Returns403_ForPilots()
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, await _client.RegisterPilotAsync());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Import_SkipsUnknownAirportsAndAirlines_AndIsIdempotent()
    {
        await EnsureImportedAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, await _client.LoginAsAdminAsync());

        response.EnsureSuccessStatusCode();
        Assert.Equal(new AirlineImportResult(0, 0, 0, 2), await response.Content.ReadFromJsonAsync<AirlineImportResult>());
    }

    [Fact]
    public async Task Search_FindsAirlineByIcao_WithRouteCount()
    {
        await EnsureImportedAsync();

        var gol = (await GetAsPilotAsync<PagedResult<AirlineResponse>>("/api/airlines?q=GLO")).Items[0];

        Assert.Equal("Gol Transportes Aéreos", gol.Name);
        Assert.Equal("G3", gol.IataCode);
        Assert.True(gol.IsActive);
        Assert.Equal(2, gol.RouteCount);
    }

    [Fact]
    public async Task Search_FiltersByActive()
    {
        await EnsureImportedAsync();

        var active = await GetAsPilotAsync<PagedResult<AirlineResponse>>("/api/airlines?q=OLD&active=true");
        var inactive = await GetAsPilotAsync<PagedResult<AirlineResponse>>("/api/airlines?q=OLD&active=false");

        Assert.DoesNotContain(active.Items, a => a.IcaoCode == "OLD");
        Assert.Contains(inactive.Items, a => a.IcaoCode == "OLD");
    }

    [Fact]
    public async Task Routes_ListsBothDirectionsWithDistance()
    {
        await EnsureImportedAsync();
        var gol = await FindAsync("GLO");

        var routes = await GetAsPilotAsync<PagedResult<RouteResponse>>($"/api/airlines/{gol.Id}/routes");

        Assert.Equal(2, routes.TotalCount);
        var first = routes.Items[0];
        Assert.Equal(("SBFL", "FLN", "SBGR", "GRU", 278), (first.Origin, first.OriginIata, first.Destination, first.DestinationIata, first.DistanceNm));
    }

    [Fact]
    public async Task Routes_FiltersBothDirectionsBetweenTwoAirports()
    {
        await EnsureImportedAsync();
        var gol = await FindAsync("GLO");

        var between = await GetAsPilotAsync<PagedResult<RouteResponse>>($"/api/airlines/{gol.Id}/routes?from=sbgr&to=SBFL");
        var none = await GetAsPilotAsync<PagedResult<RouteResponse>>($"/api/airlines/{gol.Id}/routes?from=SBGR&to=SSKT");

        Assert.Equal(2, between.TotalCount);
        Assert.Equal(0, none.TotalCount);
    }

    [Fact]
    public async Task Network_JoinsBothDirectionsIntoOneLink()
    {
        await EnsureImportedAsync();
        var gol = await FindAsync("GLO");

        var network = await GetAsPilotAsync<RouteNetworkResponse>($"/api/airlines/{gol.Id}/network");

        Assert.Equal(new[] { "SBFL", "SBGR" }, network.Airports.Select(a => a.Code));
        Assert.Equal("FLN", network.Airports[0].IataCode);
        Assert.Equal(new[] { 0, 1 }, Assert.Single(network.Links));
    }

    [Fact]
    public async Task Get_Returns404_ForUnknownAirline()
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/airlines/999999", await _client.RegisterPilotAsync());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_Returns409_WhenAnActiveAirlineUsesTheIcao()
    {
        await EnsureImportedAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airlines", await _client.LoginAsAdminAsync(),
            new AirlineRequest("Another Gol", null, "GLO", null, "Brazil", true));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Create_Returns400_ForInvalidIcao()
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airlines", await _client.LoginAsAdminAsync(),
            new AirlineRequest("Bad Code", null, "G1O", null, null, true));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Admin_ManagesAirlineFleetAndRoutes()
    {
        await EnsureImportedAsync();
        var token = await _client.LoginAsAdminAsync();
        var icao = NewIcao();

        var created = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airlines", token,
            new AirlineRequest("SkyBridge Test Air", null, icao.ToLowerInvariant(), "SKYTEST", "Brazil", true));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var airline = (await created.Content.ReadFromJsonAsync<AirlineDetailResponse>())!;
        Assert.Equal(icao, airline.IcaoCode);
        var baseUrl = $"/api/admin/airlines/{airline.Id}";

        var fleet = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{baseUrl}/fleet", token, new FleetRequest(["b738", "A320", "B738"]));
        var unknownType = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{baseUrl}/fleet", token, new FleetRequest(["ZZZZ"]));
        Assert.Equal(new[] { "A320", "B738" }, (await fleet.Content.ReadFromJsonAsync<AirlineDetailResponse>())!.Fleet.Select(f => f.IcaoCode).Order());
        Assert.Equal(HttpStatusCode.BadRequest, unknownType.StatusCode);

        var route = await _client.SendAuthorizedAsync(HttpMethod.Post, $"{baseUrl}/routes", token, new RouteRequest("sbfl", "SBGR"));
        var duplicate = await _client.SendAuthorizedAsync(HttpMethod.Post, $"{baseUrl}/routes", token, new RouteRequest("SBFL", "SBGR"));
        var sameAirport = await _client.SendAuthorizedAsync(HttpMethod.Post, $"{baseUrl}/routes", token, new RouteRequest("SBFL", "SBFL"));
        var unknownAirport = await _client.SendAuthorizedAsync(HttpMethod.Post, $"{baseUrl}/routes", token, new RouteRequest("SBFL", "ZZZZ"));
        Assert.Equal(HttpStatusCode.Created, route.StatusCode);
        var added = (await route.Content.ReadFromJsonAsync<RouteResponse>())!;
        Assert.Equal(278, added.DistanceNm);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, sameAirport.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, unknownAirport.StatusCode);

        var deletedRoute = await _client.SendAuthorizedAsync(HttpMethod.Delete, $"{baseUrl}/routes/{added.Id}", token);
        Assert.Equal(HttpStatusCode.NoContent, deletedRoute.StatusCode);

        var updated = await _client.SendAuthorizedAsync(HttpMethod.Put, baseUrl, token,
            new AirlineRequest("SkyBridge Test Air", "S9", icao, "SKYTEST", "Brazil", false));
        Assert.False((await updated.Content.ReadFromJsonAsync<AirlineDetailResponse>())!.IsActive);

        var deleted = await _client.SendAuthorizedAsync(HttpMethod.Delete, baseUrl, token);
        var afterDelete = await _client.SendAuthorizedAsync(HttpMethod.Get, $"/api/airlines/{airline.Id}", token);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, afterDelete.StatusCode);
    }

    private async Task EnsureImportedAsync()
    {
        var token = await _client.LoginAsAdminAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", token)).EnsureSuccessStatusCode();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, token)).EnsureSuccessStatusCode();
    }

    private async Task<AirlineResponse> FindAsync(string icao) =>
        (await GetAsPilotAsync<PagedResult<AirlineResponse>>($"/api/airlines?q={icao}")).Items.First(a => a.IcaoCode == icao);

    private async Task<T> GetAsPilotAsync<T>(string url)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, url, await _client.RegisterPilotAsync());
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }

    private static string NewIcao()
    {
        var letters = Guid.NewGuid().ToString("N").Where(char.IsLetter).Take(2).Select(char.ToUpperInvariant);
        return "Q" + string.Concat(letters).PadRight(2, 'X');
    }
}