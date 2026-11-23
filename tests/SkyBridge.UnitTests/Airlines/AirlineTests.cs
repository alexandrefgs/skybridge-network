using SkyBridge.Domain.Airlines;

namespace SkyBridge.UnitTests.Airlines;

public class AirlineTests
{
    private static AirlineData Gol() => new("Gol Transportes Aéreos", "G3", "GLO", "GOL TRANSPORTE", "Brazil", true);

    [Fact]
    public void Create_NormalizesCodesAndEmptyValues()
    {
        var airline = Airline.Create(new AirlineData(" Gol ", "g3", "glo", "gol transporte", " ", true), sourceId: 2581);

        Assert.Equal("Gol", airline.Name);
        Assert.Equal("G3", airline.IataCode);
        Assert.Equal("GLO", airline.IcaoCode);
        Assert.Equal("GOL TRANSPORTE", airline.Callsign);
        Assert.Null(airline.Country);
        Assert.Equal(2581, airline.SourceId);
    }

    [Theory]
    [InlineData("G33", null)]
    [InlineData(null, "GL")]
    [InlineData(null, "GL0")]
    public void Create_RejectsInvalidCodes(string? iata, string? icao)
    {
        Assert.Throws<ArgumentException>(() => Airline.Create(Gol() with { IataCode = iata, IcaoCode = icao }));
    }

    [Fact]
    public void Apply_ReturnsFalse_WhenNothingChanged()
    {
        var airline = Airline.Create(Gol());

        Assert.False(airline.Apply(Gol()));
        Assert.True(airline.Apply(Gol() with { IsActive = false }));
        Assert.False(airline.IsActive);
    }

    [Fact]
    public void SetFleet_AddsAndRemovesTypes()
    {
        var airline = Airline.Create(Gol());

        airline.SetFleet([1, 2, 2]);
        airline.SetFleet([2, 3]);

        Assert.Equal(new[] { 2, 3 }, airline.Fleet.Select(f => f.AircraftTypeId).Order());
    }
}