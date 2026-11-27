using SkyBridge.Application.Public;

namespace SkyBridge.UnitTests.Public;

public class NetworkFeedParserTests
{
    [Fact]
    public void VatsimPilotIds_ReadsTheCidOfEveryPilot()
    {
        const string json = """{ "general": {}, "pilots": [ { "cid": 1234567, "callsign": "GLO1042" }, { "cid": 7654321 }, { "callsign": "NOCID" } ], "controllers": [ { "cid": 999 } ] }""";

        Assert.Equal(new[] { 1234567, 7654321 }, VatsimIds(json));
    }

    [Fact]
    public void IvaoPilotIds_ReadsTheUserIdOfEveryPilot()
    {
        const string json = """{ "updatedAt": "2026-11-26T21:00:00Z", "clients": { "pilots": [ { "userId": 654321 }, { "userId": "123456" } ], "atcs": [ { "userId": 1 } ] } }""";

        Assert.Equal(new[] { 123456, 654321 }, NetworkFeedParser.IvaoPilotIds(json)!.Order());
    }

    [Theory]
    [InlineData("not json")]
    [InlineData("[]")]
    [InlineData("""{ "general": {} }""")]
    public void PilotIds_AreUnknown_WhenTheFeedIsBroken(string json)
    {
        Assert.Null(NetworkFeedParser.VatsimPilotIds(json));
        Assert.Null(NetworkFeedParser.IvaoPilotIds(json));
    }

    [Fact]
    public void PilotIds_AreEmpty_WhenNobodyIsFlying()
    {
        Assert.Empty(NetworkFeedParser.VatsimPilotIds("""{ "pilots": [] }""")!);
    }

    private static int[] VatsimIds(string json) => NetworkFeedParser.VatsimPilotIds(json)!.Order().ToArray();
}