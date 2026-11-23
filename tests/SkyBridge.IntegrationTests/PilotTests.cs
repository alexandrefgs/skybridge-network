using System.Net;
using System.Net.Http.Json;
using SkyBridge.Application.Pilots;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class PilotTests(SkyBridgeApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Get_Returns401_WhenAnonymous()
    {
        var response = await _client.GetAsync("/api/pilot");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task NewPilot_HasNoLocationAndNoHours()
    {
        var token = await _client.RegisterPilotAsync();

        var pilot = await GetPilotAsync(token);

        Assert.Null(pilot.Location);
        Assert.Equal(0m, pilot.FlightHours);
    }

    [Fact]
    public async Task Jumpseat_ChoosesTheStartAndMovesAgain()
    {
        var token = await _client.RegisterPilotAsync();
        await EnsureAirportsAsync();

        var first = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pilot/jumpseat", token, new JumpseatRequest("sbfl"));
        var second = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pilot/jumpseat", token, new JumpseatRequest("SSKT"));

        first.EnsureSuccessStatusCode();
        Assert.Equal("SBFL", (await first.Content.ReadFromJsonAsync<PilotResponse>())!.Location!.Code);
        second.EnsureSuccessStatusCode();
        var location = (await GetPilotAsync(token)).Location!;
        Assert.Equal(("SSKT", "Aeroclube de Santa Catarina"), (location.Code, location.Name));
    }

    [Fact]
    public async Task Jumpseat_Returns400_ForUnknownAirport()
    {
        var token = await _client.RegisterPilotAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pilot/jumpseat", token, new JumpseatRequest("ZZZZ"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null((await GetPilotAsync(token)).Location);
    }

    private async Task EnsureAirportsAsync() =>
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", await _client.LoginAsAdminAsync())).EnsureSuccessStatusCode();

    private async Task<PilotResponse> GetPilotAsync(string token)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/pilot", token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PilotResponse>())!;
    }
}