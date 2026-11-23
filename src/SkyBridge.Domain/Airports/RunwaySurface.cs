namespace SkyBridge.Domain.Airports;

public enum RunwaySurface
{
    Unknown = 0,
    Paved = 1,
    Unpaved = 2,
    Water = 3
}

public static class RunwaySurfaces
{
    private static readonly string[] PavedPrefixes = ["ASP", "ASF", "CON", "PEM", "BIT", "PAV", "COP", "COM", "BET", "MAC", "TAR", "SEAL", "BRI", "HARD", "PSP"];

    private static readonly string[] UnpavedPrefixes =
    [
        "TURF", "GR", "GVL", "EARTH", "DIRT", "DRT", "SAN", "CLA", "TER", "PI", "PER", "GROUND", "COR", "CRUSH", "LAT",
        "SOIL", "SNO", "ICE", "ROCK", "MUD", "SILT", "LIM", "SHALE", "STONE", "OIL", "TREATED", "TRTD", "UNPAVED",
        "CALICHE", "RED", "BROWN", "ROUGH"
    ];

    public static RunwaySurface Classify(string? surface)
    {
        if (string.IsNullOrWhiteSpace(surface))
            return RunwaySurface.Unknown;

        var token = surface.Trim().ToUpperInvariant().Split(['-', '/', ' ', ','], 2)[0];

        if (token.StartsWith("WAT", StringComparison.Ordinal))
            return RunwaySurface.Water;
        if (UnpavedPrefixes.Any(p => token.StartsWith(p, StringComparison.Ordinal)))
            return RunwaySurface.Unpaved;
        if (PavedPrefixes.Any(p => token.StartsWith(p, StringComparison.Ordinal)))
            return RunwaySurface.Paved;

        return RunwaySurface.Unknown;
    }
}