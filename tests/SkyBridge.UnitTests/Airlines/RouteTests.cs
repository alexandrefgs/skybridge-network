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
}