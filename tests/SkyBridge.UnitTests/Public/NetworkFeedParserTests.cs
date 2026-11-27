using SkyBridge.Application.Public;

namespace SkyBridge.UnitTests.Public;

public class NetworkFeedParserTests
{
    [Fact]
    public void VatsimPilots_ReadTheIdPositionAndFlightPlan()
    {
        const string json = """
            { "general": {}, "pilots": [
              { "cid": 1234567, "callsign": "GLO1450", "latitude": -26.1, "longitude": -48.9, "altitude": 35012, "groundspeed": 448, "heading": 218,
                "flight_plan": { "departure": "sbgr", "arrival": "SBPA", "aircraft_short": "B738" } },
              { "cid": 7654321, "callsign": "SKB10", "latitude": -23.4, "longitude": -46.4, "altitude": 0, "groundspeed": 0, "heading": 360, "flight_plan": null },
              { "callsign": "NOCID" } ],
              "controllers": [ { "cid": 999 } ] }
            """;

        var pilots = NetworkFeedParser.VatsimPilots(json)!;

        Assert.Equal(new[] { 1234567, 7654321 }, pilots.Keys.Order());
        Assert.Equal(new NetworkPilot(1234567, "GLO1450", -26.1, -48.9, 35012, 448, 218, "SBGR", "SBPA", "B738"), pilots[1234567]);
        Assert.Equal((0, (string?)null, (string?)null), (pilots[7654321].Heading, pilots[7654321].Departure, pilots[7654321].Aircraft));
    }

    [Fact]
    public void IvaoPilots_ReadTheIdPositionAndFlightPlan()
    {
        const string json = """
            { "updatedAt": "2026-11-26T21:00:00Z", "clients": { "pilots": [
              { "userId": 654321, "callsign": "SKB2190", "lastTrack": { "latitude": -25.5, "longitude": -51.2, "altitude": 9480.6, "groundSpeed": 162, "heading": -90 },
                "flightPlan": { "departureId": "SBCT", "arrivalId": "SBFI", "aircraftId": "C208" } },
              { "userId": "123456", "callsign": "SKB1", "lastTrack": null } ],
              "atcs": [ { "userId": 1 } ] } }
            """;

        var pilots = NetworkFeedParser.IvaoPilots(json)!;

        Assert.Equal(new[] { 123456, 654321 }, pilots.Keys.Order());
        Assert.Equal(new NetworkPilot(654321, "SKB2190", -25.5, -51.2, 9481, 162, 270, "SBCT", "SBFI", "C208"), pilots[654321]);
        Assert.False(pilots[123456].HasPosition);
    }

    [Theory]
    [InlineData("not json")]
    [InlineData("[]")]
    [InlineData("""{ "general": {} }""")]
    [InlineData("""{ "clients": [] }""")]
    public void Pilots_AreUnknown_WhenTheFeedIsBroken(string json)
    {
        Assert.Null(NetworkFeedParser.VatsimPilots(json));
        Assert.Null(NetworkFeedParser.IvaoPilots(json));
    }

    [Fact]
    public void Pilots_AreEmpty_WhenNobodyIsFlying()
    {
        Assert.Empty(NetworkFeedParser.VatsimPilots("""{ "pilots": [] }""")!);
        Assert.Empty(NetworkFeedParser.IvaoPilots("""{ "clients": { "pilots": [] } }""")!);
    }
}