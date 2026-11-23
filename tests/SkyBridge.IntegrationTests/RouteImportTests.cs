using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Common;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class RouteImportTests(SkyBridgeApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task ImportCsv_AddsUpdatesAndSkipsWithoutDuplicating()
    {
        var (token, airline) = await CreateAirlineAsync();

        var first = await ImportAsync(token, airline.Id, "routes.csv", """
            origin,destination,aircraft,route,fl
            SBFL,SBGR,B738,UZ10 BUXUK,330
            SBGR,SBFL,B738 ZZZZ,,
            SBFL,ZZZZ,,,
            """);
        Assert.Equal((2, 0, 0, 1), (first.Added, first.Updated, first.Unchanged, first.Skipped));
        Assert.Equal(new[] { "B738" }, first.FleetAdded);
        Assert.Contains(first.Issues, i => i.Message.Contains("ZZZZ is not in the catalog"));
        Assert.Contains(first.Issues, i => i.Message.Contains("Airport ZZZZ was not found"));

        var again = await ImportAsync(token, airline.Id, "routes.csv", """
            origin,destination,aircraft,route,fl
            SBFL,SBGR,B738,UZ10 BUXUK,330
            SBGR,SBFL,B738,,
            """);
        Assert.Equal((0, 0, 2), (again.Added, again.Updated, again.Unchanged));

        var changed = await ImportAsync(token, airline.Id, "routes.csv", """
            origin,destination,aircraft,route,fl
            SBFL,SBGR,,,FL350
            """);
        Assert.Equal((0, 1, 0), (changed.Added, changed.Updated, changed.Unchanged));

        var route = (await GetRoutesAsync(token, airline.Id)).Items.Single(r => r.Origin == "SBFL");
        Assert.Equal(("UZ10 BUXUK", (int?)350), (route.AtsRoute, route.FlightLevel));
        Assert.Equal(new[] { "B738" }, route.Aircraft);

        var detail = await GetAirlineAsync(token, airline.Id);
        Assert.Equal("CSV file", detail.RoutesSource);
        Assert.NotNull(detail.RoutesUpdatedAtUtc);
    }

    [Fact]
    public async Task ImportRpl_Returns400_WhenTheFileBelongsToAnotherAirline()
    {
        var (token, airline) = await CreateAirlineAsync();

        var response = await PostFileAsync(token, airline.Id, "Cia_XYZ_CS.txt",
            Rpl.Header("XYZ") + Rpl.Flight("XYZ1000", "B738", "SBFL", "SBGR", 330, "UZ10 BUXUK"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SyncFromCgna_ImportsTheRpl_AndRecordsTheLastSync()
    {
        var (token, airline) = await CreateAirlineAsync();
        var url = $"/api/admin/airlines/{airline.Id}/routes/sync-cgna";

        var first = await _client.SendAuthorizedAsync(HttpMethod.Post, url, token);
        var second = await _client.SendAuthorizedAsync(HttpMethod.Post, url, token);

        var firstResult = (await first.Content.ReadFromJsonAsync<RouteImportResult>())!;
        var secondResult = (await second.Content.ReadFromJsonAsync<RouteImportResult>())!;
        Assert.Equal(("RPL", (DateOnly?)FakeRplSource.Edition, 2), (firstResult.Format, firstResult.Edition, firstResult.Added));
        Assert.Equal((0, 2), (secondResult.Added, secondResult.Unchanged));

        var detail = await GetAirlineAsync(token, airline.Id);
        Assert.Equal(("CGNA", (DateOnly?)FakeRplSource.Edition), (detail.RoutesSource, detail.RoutesEdition));
        Assert.Equal(new[] { "B738" }, detail.Fleet.Select(f => f.IcaoCode));
    }

    [Fact]
    public async Task SyncFromCgna_Returns400_WhenThereIsNoRpl()
    {
        var token = await _client.LoginAsAdminAsync();
        var created = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airlines", token,
            new AirlineRequest("No Rpl Air", null, "NON", null, null, false));
        var airline = (await created.Content.ReadFromJsonAsync<AirlineDetailResponse>())!;

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, $"/api/admin/airlines/{airline.Id}/routes/sync-cgna", token);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Routes_CanBeEdited_AndDeletedAll()
    {
        var (token, airline) = await CreateAirlineAsync();
        var baseUrl = $"/api/admin/airlines/{airline.Id}/routes";

        var created = await _client.SendAuthorizedAsync(HttpMethod.Post, baseUrl, token,
            new RouteRequest("SBFL", "SBGR", ["B738"], "uz10   buxuk", 330));
        var route = (await created.Content.ReadFromJsonAsync<RouteResponse>())!;
        Assert.Equal(("UZ10 BUXUK", (int?)330), (route.AtsRoute, route.FlightLevel));

        var invalidLevel = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{baseUrl}/{route.Id}", token,
            new RouteDetailsRequest(["B738"], null, 700));
        var updated = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{baseUrl}/{route.Id}", token,
            new RouteDetailsRequest(["A320", "B738"], null, null));
        Assert.Equal(HttpStatusCode.BadRequest, invalidLevel.StatusCode);
        var edited = (await updated.Content.ReadFromJsonAsync<RouteResponse>())!;
        Assert.Equal(new[] { "A320", "B738" }, edited.Aircraft);
        Assert.Null(edited.AtsRoute);
        Assert.Null(edited.FlightLevel);

        await _client.SendAuthorizedAsync(HttpMethod.Post, baseUrl, token, new RouteRequest("SBGR", "SBFL"));
        var deleted = await _client.SendAuthorizedAsync(HttpMethod.Delete, baseUrl, token);

        Assert.Equal(HttpStatusCode.OK, deleted.StatusCode);
        Assert.Equal(0, (await GetRoutesAsync(token, airline.Id)).TotalCount);
    }

    private async Task<(string Token, AirlineDetailResponse Airline)> CreateAirlineAsync()
    {
        var token = await _client.LoginAsAdminAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", token)).EnsureSuccessStatusCode();

        var letters = Guid.NewGuid().ToString("N").Where(char.IsLetter).Take(2).Select(char.ToUpperInvariant);
        var icao = "R" + string.Concat(letters).PadRight(2, 'X');

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airlines", token,
            new AirlineRequest($"Route Test {icao}", null, icao, null, "Brazil", false));
        response.EnsureSuccessStatusCode();
        return (token, (await response.Content.ReadFromJsonAsync<AirlineDetailResponse>())!);
    }

    private async Task<HttpResponseMessage> PostFileAsync(string token, int airlineId, string fileName, string content)
    {
        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(Encoding.UTF8.GetBytes(content));
        file.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
        form.Add(file, "file", fileName);

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/admin/airlines/{airlineId}/routes/import") { Content = form };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await _client.SendAsync(request);
    }

    private async Task<RouteImportResult> ImportAsync(string token, int airlineId, string fileName, string content)
    {
        var response = await PostFileAsync(token, airlineId, fileName, content);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RouteImportResult>())!;
    }

    private async Task<PagedResult<RouteResponse>> GetRoutesAsync(string token, int airlineId)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, $"/api/airlines/{airlineId}/routes", token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PagedResult<RouteResponse>>())!;
    }

    private async Task<AirlineDetailResponse> GetAirlineAsync(string token, int airlineId)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, $"/api/airlines/{airlineId}", token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AirlineDetailResponse>())!;
    }
}