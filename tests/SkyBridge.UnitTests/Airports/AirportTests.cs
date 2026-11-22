using SkyBridge.Domain.Airports;

namespace SkyBridge.UnitTests.Airports;

public class AirportTests
{
    private static AirportData Florianopolis() =>
        new("SBFL", "SBFL", "FLN", "Hercílio Luz International Airport", AirportType.Large,
            -27.670279, -48.552502, 16, "BR", "BR-SC", "Florianópolis", true);

    [Fact]
    public void Apply_ReturnsFalse_WhenNothingChanged()
    {
        var airport = Airport.Create(Florianopolis());

        Assert.False(airport.Apply(Florianopolis()));
    }

    [Fact]
    public void Apply_UpdatesFields_WhenDataChanged()
    {
        var airport = Airport.Create(Florianopolis());

        var changed = airport.Apply(Florianopolis() with { Name = "Florianópolis International Airport", ElevationFt = 20 });

        Assert.True(changed);
        Assert.Equal("Florianópolis International Airport", airport.Name);
        Assert.Equal(20, airport.ElevationFt);
    }

    [Fact]
    public void Create_Throws_WhenIdentIsMissing()
    {
        Assert.Throws<ArgumentException>(() => Airport.Create(Florianopolis() with { Ident = " " }));
    }
}