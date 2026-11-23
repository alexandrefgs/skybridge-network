using SkyBridge.Domain.Airports;

namespace SkyBridge.UnitTests.Airports;

public class RunwaySurfacesTests
{
    [Theory]
    [InlineData("ASP", RunwaySurface.Paved)]
    [InlineData("ASPH-G", RunwaySurface.Paved)]
    [InlineData("Asphalt", RunwaySurface.Paved)]
    [InlineData("CON", RunwaySurface.Paved)]
    [InlineData("PEM", RunwaySurface.Paved)]
    [InlineData("ASPH-TURF", RunwaySurface.Paved)]
    [InlineData("TURF", RunwaySurface.Unpaved)]
    [InlineData("GRS", RunwaySurface.Unpaved)]
    [InlineData("GVL", RunwaySurface.Unpaved)]
    [InlineData("TURF-ASPH", RunwaySurface.Unpaved)]
    [InlineData("PIÇARRA", RunwaySurface.Unpaved)]
    [InlineData("Grassed brown clay", RunwaySurface.Unpaved)]
    [InlineData("Treated gravel", RunwaySurface.Unpaved)]
    [InlineData("WATER", RunwaySurface.Water)]
    [InlineData("UNK", RunwaySurface.Unknown)]
    [InlineData("", RunwaySurface.Unknown)]
    [InlineData(null, RunwaySurface.Unknown)]
    public void Classify_UsesTheFirstSurfaceCode(string? surface, RunwaySurface expected)
    {
        Assert.Equal(expected, RunwaySurfaces.Classify(surface));
    }
}