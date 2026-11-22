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
    bool ScheduledService)
{
    public static AirportResponse From(Airport airport) =>
        new(airport.Ident, airport.IcaoCode, airport.IataCode, airport.Name, airport.Type.ToString(),
            airport.Latitude, airport.Longitude, airport.ElevationFt, airport.CountryCode, airport.RegionCode,
            airport.Municipality, airport.ScheduledService);
}

public sealed record AirportSearch(string? Query, string? Country, int Page = 1, int PageSize = 20);

public sealed record AirportImportResult(int Added, int Updated, int Unchanged, int Total);