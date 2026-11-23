using SkyBridge.Domain.Airports;

namespace SkyBridge.Application.Airports;

public sealed record AirportResponse(
    string Ident,
    string? IcaoCode,
    string? IataCode,
    string Name,
    string Type,
    double Latitude,
    double Longitude,
    int? ElevationFt,
    string CountryCode,
    string RegionCode,
    string? Municipality,
    bool ScheduledService,
    int? LongestRunwayFt)
{
    public static AirportResponse From(Airport airport) =>
        new(airport.Ident, airport.IcaoCode, airport.IataCode, airport.Name, airport.Type.ToString(),
            airport.Latitude, airport.Longitude, airport.ElevationFt, airport.CountryCode, airport.RegionCode,
            airport.Municipality, airport.ScheduledService, airport.LongestRunwayFt);
}

public sealed record RunwayResponse(
    string Name,
    int? LengthFt,
    int? WidthFt,
    string? Surface,
    string SurfaceType,
    bool Lighted,
    double? HeadingDegT)
{
    public static RunwayResponse From(Runway runway) =>
        new(RunwayName(runway), runway.LengthFt, runway.WidthFt, runway.Surface, runway.SurfaceType.ToString(),
            runway.Lighted, runway.HeadingDegT);

    private static string RunwayName(Runway runway) =>
        (runway.LowEndIdent, runway.HighEndIdent) switch
        {
            (not null, not null) => $"{runway.LowEndIdent}/{runway.HighEndIdent}",
            (not null, null) => runway.LowEndIdent,
            (null, not null) => runway.HighEndIdent,
            _ => "—"
        };
}

public sealed record AirportSearch(string? Query, string? Country, int Page = 1, int PageSize = 20);

public sealed record AirportImportResult(int Added, int Updated, int Unchanged, int Total);

public sealed record RunwayImportResult(int Added, int Updated, int Removed, int AirportsWithRunways);

public sealed record AirportCatalogImportResult(AirportImportResult Airports, RunwayImportResult Runways);