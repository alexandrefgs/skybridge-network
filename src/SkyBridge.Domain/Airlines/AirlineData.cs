namespace SkyBridge.Domain.Airlines;

public sealed record AirlineData(
    string Name,
    string? IataCode,
    string? IcaoCode,
    string? Callsign,
    string? Country,
    bool IsActive);