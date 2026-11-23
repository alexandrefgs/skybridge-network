using SkyBridge.Domain.Aircraft;

namespace SkyBridge.UnitTests.Aircraft;

public class RouteChecksTests
{
    private static readonly AircraftLimits A332 = new("A332", 7250, 6500, true);
    private static readonly AircraftLimits B738 = new("B738", 2935, 4300, true);
    private static readonly AircraftLimits C208 = new("C208", 900, 2300, false);

    private static readonly AirportRunways Guarulhos = new("SBGR", 12139, 12139);
    private static readonly AirportRunways Congonhas = new("SBSP", 6365, 6365);
    private static readonly AirportRunways DirtStrip = new("SDXX", 3000, null);
    private static readonly AirportRunways NoData = new("SNXX", null, null);

    [Fact]
    public void Warnings_IsEmpty_WhenEveryAircraftFits()
    {
        Assert.Empty(RouteChecks.Warnings(200, Guarulhos, Congonhas, [B738]));
    }

    [Fact]
    public void Warnings_FlagsHeaviesAtCongonhas()
    {
        var warnings = RouteChecks.Warnings(200, Guarulhos, Congonhas, [A332, B738]);

        Assert.Equal(new[] { "A332 needs 6,500 ft, SBSP longest runway is 6,365 ft" }, warnings);
    }

    [Fact]
    public void Warnings_FlagsUnpavedRunwaysAndRange()
    {
        var warnings = RouteChecks.Warnings(1200, Guarulhos, DirtStrip, [B738, C208]);

        Assert.Equal(new[]
        {
            "B738 needs 4,300 ft, SDXX longest runway is 3,000 ft",
            "C208: 1,200 nm is beyond its 900 nm range"
        }, warnings);
    }

    [Fact]
    public void Warnings_SaysNeedsPaved_WhenOnlyTheUnpavedRunwayIsLongEnough()
    {
        var strip = new AirportRunways("SDYY", 5000, 2000);

        Assert.Equal(new[] { "B738 needs a paved runway at SDYY" }, RouteChecks.Warnings(100, Guarulhos, strip, [B738]));
    }

    [Fact]
    public void Warnings_IgnoresAirportsWithoutRunwayData()
    {
        Assert.Empty(RouteChecks.Warnings(100, Guarulhos, NoData, [A332]));
    }
}