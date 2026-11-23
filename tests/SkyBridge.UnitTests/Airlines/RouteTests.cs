using SkyBridge.Domain.Routes;

namespace SkyBridge.UnitTests.Airlines;

public class RouteTests
{
    [Fact]
    public void Create_CalculatesTheDistance()
    {
        var route = Route.Create(1, 10, -27.670279, -48.552502, 20, -23.431944, -46.467778);

        Assert.Equal(1, route.AirlineId);
        Assert.Equal(10, route.OriginAirportId);
        Assert.Equal(20, route.DestinationAirportId);
        Assert.Equal(278, route.DistanceNm);
    }

    [Fact]
    public void Create_RejectsTheSameAirport()
    {
        Assert.Throws<ArgumentException>(() => Route.Create(1, 10, 0, 0, 10, 0, 0));
    }

    [Fact]
    public void SetDetails_NormalizesTheRoute_AndReportsChanges()
    {
        var route = Route.Create(1, 10, 0, 0, 20, 1, 1);

        Assert.True(route.SetDetails("  nibru   uz171 kevun ", 370));
        Assert.Equal("NIBRU UZ171 KEVUN", route.AtsRoute);
        Assert.Equal(370, route.FlightLevel);
        Assert.False(route.SetDetails("NIBRU UZ171 KEVUN", 370));
        Assert.True(route.SetDetails(" ", null));
        Assert.Null(route.AtsRoute);
    }

    [Theory]
    [InlineData(5)]
    [InlineData(610)]
    public void SetDetails_RejectsFlightLevelsOutOfRange(int level)
    {
        var route = Route.Create(1, 10, 0, 0, 20, 1, 1);

        Assert.Throws<ArgumentOutOfRangeException>(() => route.SetDetails(null, level));
    }

    [Fact]
    public void SetAircraft_ReportsChanges()
    {
        var route = Route.Create(1, 10, 0, 0, 20, 1, 1);

        Assert.True(route.SetAircraft([1, 2]));
        Assert.False(route.SetAircraft([2, 1]));
        Assert.True(route.SetAircraft([2]));
        Assert.Equal(new[] { 2 }, route.Aircraft.Select(a => a.AircraftTypeId));
    }
}