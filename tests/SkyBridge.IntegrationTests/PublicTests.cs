using System.Net;
using System.Net.Http.Json;
using SkyBridge.Application.Pilots;
using SkyBridge.Application.Public;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class PublicTests(SkyBridgeApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Stats_AreOpenToVisitors()
    {
        var response = await _client.GetAsync("/api/public/stats");

        response.EnsureSuccessStatusCode();
        var stats = (await response.Content.ReadFromJsonAsync<PublicStatsResponse>())!;
        Assert.True(stats.Aircraft > 0);
        Assert.True(stats.TotalFlights >= stats.FlightsThisMonth);
    }

    [Fact]
    public async Task Stats_CountTheLinkedPilotsOnline_OnEachNetwork()
    {
        var vatsimId = Random.Shared.Next(1_000_000, 9_999_999);
        var ivaoId = Random.Shared.Next(100_000, 999_999);
        FakeOnlineNetworks.Vatsim[vatsimId] = 0;
        FakeOnlineNetworks.Ivao[ivaoId] = 0;
        var before = await StatsAsync();

        var pilot = await _client.RegisterPilotAsync();
        var linked = await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/pilot/networks", pilot, new NetworksRequest(vatsimId, ivaoId));
        var after = await StatsAsync();

        var body = (await linked.Content.ReadFromJsonAsync<PilotResponse>())!;
        Assert.Equal((vatsimId, ivaoId), (body.VatsimId, body.IvaoId));
        Assert.Equal(before.OnlineVatsim + 1, after.OnlineVatsim);
        Assert.Equal(before.OnlineIvao + 1, after.OnlineIvao);
    }

    [Fact]
    public async Task Stats_LeaveTheNetworkEmpty_WhenItsFeedIsDown()
    {
        FakeOnlineNetworks.IvaoDown = true;
        try
        {
            var stats = await StatsAsync();

            Assert.NotNull(stats.OnlineVatsim);
            Assert.Null(stats.OnlineIvao);
        }
        finally
        {
            FakeOnlineNetworks.IvaoDown = false;
        }
    }

    [Fact]
    public async Task LinkNetworks_ValidatesAndClearsTheIds()
    {
        var pilot = await _client.RegisterPilotAsync();

        var invalid = await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/pilot/networks", pilot, new NetworksRequest(0, 123456789));
        var cleared = await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/pilot/networks", pilot, new NetworksRequest(null, null));

        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var body = (await cleared.Content.ReadFromJsonAsync<PilotResponse>())!;
        Assert.Equal((null, null), (body.VatsimId, body.IvaoId));
    }

    [Fact]
    public async Task Flights_ClampTheCount()
    {
        var response = await _client.GetAsync("/api/public/flights?count=500");

        response.EnsureSuccessStatusCode();
        Assert.True((await response.Content.ReadFromJsonAsync<List<PublicFlightResponse>>())!.Count <= 12);
    }

    private async Task<PublicStatsResponse> StatsAsync() =>
        (await _client.GetFromJsonAsync<PublicStatsResponse>("/api/public/stats"))!;
}