using SkyBridge.Domain.Pilots;

namespace SkyBridge.UnitTests.Pilots;

public class PilotTests
{
    [Fact]
    public void Create_StartsWithoutLocationOrHours()
    {
        var pilot = Pilot.Create(Guid.NewGuid());

        Assert.Null(pilot.CurrentAirportId);
        Assert.Equal(0m, pilot.FlightHours);
    }

    [Fact]
    public void Create_RejectsEmptyUser()
    {
        Assert.Throws<ArgumentException>(() => Pilot.Create(Guid.Empty));
    }

    [Fact]
    public void MoveTo_ChangesTheCurrentAirport()
    {
        var pilot = Pilot.Create(Guid.NewGuid());

        pilot.MoveTo(42);
        pilot.MoveTo(7);

        Assert.Equal(7, pilot.CurrentAirportId);
    }
}