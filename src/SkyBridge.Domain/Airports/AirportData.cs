namespace SkyBridge.Domain.Airports;

public sealed record AirportData(
    string Ident,
    string? IcaoCode,
    string? IataCode,
    string Name,
    AirportType Type,
    double Latitude,
    double Longitude,
    int? ElevationFt,
    string CountryCode,
    string RegionCode,
    string? Municipality,
    bool ScheduledService);