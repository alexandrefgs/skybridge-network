using System.Net.Http.Json;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Freelance;
using SkyBridge.Application.Pilots;
using SkyBridge.Application.Public;
using SkyBridge.Domain.Freelance;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class LiveMapTests(SkyBridgeApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Live_ShowsLinkedPilots_WithTheNetworkFlightPlan()
    {
        await ImportAirportsAsync();
        var vatsimId = Random.Shared.Next(1_000_000, 9_999_999);
        var pilot = await _client.RegisterPilotAsync();
        await LinkAsync(pilot, vatsimId, null);
        FakeOnlineNetworks.Vatsim[vatsimId] = FakeOnlineNetworks.Pilot(vatsimId, "GLO1450", -25.1, -47.2, "SBGR", "SBFL", "B738");

        var flight = (await LiveAsync()).Flights.Single(f => f.NetworkId == vatsimId);

        Assert.Equal(("VATSIM", "GLO1450", "B738", (string?)null), (flight.Network, flight.Callsign, flight.Aircraft, flight.Mission));
        Assert.Equal((-25.1, -47.2, 34000, 440, 210), (flight.Latitude, flight.Longitude, flight.AltitudeFt, flight.GroundSpeedKt, flight.Heading));
        Assert.Equal(("SBGR", "SBFL"), (flight.Origin!.Code, flight.Destination!.Code));
        Assert.Equal("Ana S.", flight.Pilot);
    }

    [Fact]
    public async Task Live_UsesTheActiveBooking_ForTheRouteAndMission()
    {
        var job = await CreateJobAsync();
        var ivaoId = Random.Shared.Next(100_000, 999_999);
        var pilot = await _client.RegisterPilotAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pilot/jumpseat", pilot, new JumpseatRequest("SBFL"))).EnsureSuccessStatusCode();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, $"/api/freelance/{job.Id}/accept", pilot, new AcceptJobRequest("C172"))).EnsureSuccessStatusCode();
        await LinkAsync(pilot, null, ivaoId);
        FakeOnlineNetworks.Ivao[ivaoId] = FakeOnlineNetworks.Pilot(ivaoId, "SKB777", departure: "SBXQ", arrival: "SSKT");

        var flight = (await LiveAsync()).Flights.Single(f => f.NetworkId == ivaoId);

        Assert.Equal(("IVAO", "Medevac", "C172"), (flight.Network, flight.Mission, flight.Aircraft));
        Assert.Equal(("SBFL", "SBGR"), (flight.Origin!.Code, flight.Destination!.Code));
        Assert.NotNull(flight.AircraftModel);
    }

    [Fact]
    public async Task Live_SkipsPilotsWithoutAPosition_AndUnlinkedPilots()
    {
        var linkedId = Random.Shared.Next(1_000_000, 9_999_999);
        var strangerId = Random.Shared.Next(1_000_000, 9_999_999);
        var pilot = await _client.RegisterPilotAsync();
        await LinkAsync(pilot, linkedId, null);
        FakeOnlineNetworks.Vatsim[linkedId] = FakeOnlineNetworks.Pilot(linkedId, latitude: null, longitude: null);
        FakeOnlineNetworks.Vatsim[strangerId] = FakeOnlineNetworks.Pilot(strangerId);

        var live = await LiveAsync();

        Assert.True(live.VatsimAvailable);
        Assert.DoesNotContain(live.Flights, f => f.NetworkId == linkedId || f.NetworkId == strangerId);
    }

    [Fact]
    public async Task Live_ReportsANetworkAsUnavailable_WhenItsFeedIsDown()
    {
        FakeOnlineNetworks.IvaoDown = true;
        try
        {
            var live = await LiveAsync();

            Assert.False(live.IvaoAvailable);
            Assert.DoesNotContain(live.Flights, f => f.Network == "IVAO");
        }
        finally
        {
            FakeOnlineNetworks.IvaoDown = false;
        }
    }

    private async Task<LiveMapResponse> LiveAsync()
    {
        var response = await _client.GetAsync("/api/public/live");
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<LiveMapResponse>())!;
    }

    private async Task LinkAsync(string token, int? vatsimId, int? ivaoId) =>
        (await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/pilot/networks", token, new NetworksRequest(vatsimId, ivaoId))).EnsureSuccessStatusCode();

    private async Task ImportAirportsAsync()
    {
        var admin = await _client.LoginAsAdminAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", admin)).EnsureSuccessStatusCode();
    }

    private async Task<FreelanceJobResponse> CreateJobAsync()
    {
        var admin = await _client.LoginAsAdminAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", admin)).EnsureSuccessStatusCode();
        var request = new FreelanceJobRequest(FreelanceJobKind.Medevac, 800, DateTime.UtcNow.AddDays(2), ["C172"],
            [new FreelanceLegRequest("SBFL", "SBGR", 2, 20)], "Test client");
        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/freelance", admin, request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;
    }
}