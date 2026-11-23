using SkyBridge.Domain.Airports;

namespace SkyBridge.UnitTests.Airports;

public class AirportRunwaysTests
{
    private static Airport Florianopolis() =>
        Airport.Create(new AirportData("SBFL", "SBFL", "FLN", "Hercílio Luz International Airport", AirportType.Large,
            -27.670279, -48.552502, 16, "BR", "BR-SC", "Florianópolis", true));

    private static RunwayData Runway(int id, int? length, RunwaySurface surface = RunwaySurface.Paved, string low = "14", string high = "32") =>
        new(id, low, high, length, 148, surface.ToString(), surface, true, 136);

    [Fact]
    public void SyncRunways_AddsRunways_AndKeepsTheLongest()
    {
        var airport = Florianopolis();

        var result = airport.SyncRunways([Runway(1, 7874), Runway(2, 4331, low: "03", high: "21")]);

        Assert.Equal(new RunwaySyncResult(2, 0, 0), result);
        Assert.Equal((7874, 7874), (airport.LongestRunwayFt!.Value, airport.LongestHardRunwayFt!.Value));
    }

    [Fact]
    public void SyncRunways_ReportsNoChange_WhenTheDataIsTheSame()
    {
        var airport = Florianopolis();
        airport.SyncRunways([Runway(1, 7874)]);

        var result = airport.SyncRunways([Runway(1, 7874)]);

        Assert.False(result.Changed);
    }

    [Fact]
    public void SyncRunways_UpdatesAndRemoves()
    {
        var airport = Florianopolis();
        airport.SyncRunways([Runway(1, 7874), Runway(2, 4331)]);

        var result = airport.SyncRunways([Runway(1, 8000)]);

        Assert.Equal(new RunwaySyncResult(0, 1, 1), result);
        Assert.Equal(8000, Assert.Single(airport.Runways).LengthFt);
        Assert.Equal(8000, airport.LongestRunwayFt);
    }

    [Fact]
    public void SyncRunways_SkipsWater_AndSeparatesHardSurfaces()
    {
        var airport = Florianopolis();

        airport.SyncRunways([Runway(1, 3000, RunwaySurface.Unpaved), Runway(2, 9000, RunwaySurface.Water), Runway(3, 2000, RunwaySurface.Unknown)]);

        Assert.Equal(2, airport.Runways.Count);
        Assert.Equal((3000, 2000), (airport.LongestRunwayFt!.Value, airport.LongestHardRunwayFt!.Value));
    }

    [Fact]
    public void SyncRunways_ClearsTheSummary_WhenNoRunwaysAreLeft()
    {
        var airport = Florianopolis();
        airport.SyncRunways([Runway(1, 7874)]);

        airport.SyncRunways([]);

        Assert.Empty(airport.Runways);
        Assert.Null(airport.LongestRunwayFt);
        Assert.Null(airport.LongestHardRunwayFt);
    }
}