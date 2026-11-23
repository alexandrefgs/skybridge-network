using System.ComponentModel.DataAnnotations;
using SkyBridge.Domain.Airlines;

namespace SkyBridge.Application.Airlines;

public sealed record AirlineResponse(
    int Id,
    string Name,
    string? IataCode,
    string? IcaoCode,
    string? Callsign,
    string? Country,
    bool IsActive,
    int RouteCount);

public sealed record FleetTypeResponse(string IcaoCode, string Manufacturer, string Model, string Category);

public sealed record AirlineDetailResponse(
    int Id,
    string Name,
    string? IataCode,
    string? IcaoCode,
    string? Callsign,
    string? Country,
    bool IsActive,
    int RouteCount,
    IReadOnlyList<FleetTypeResponse> Fleet);

public sealed record AirlineSearch(string? Query, bool? Active, int Page = 1, int PageSize = 20);

public sealed record AirlineRequest(
    [Required, MaxLength(100)] string Name,
    [RegularExpression("^[A-Za-z0-9]{2}$")] string? IataCode,
    [RegularExpression("^[A-Za-z]{3}$")] string? IcaoCode,
    [MaxLength(60)] string? Callsign,
    [MaxLength(60)] string? Country,
    bool IsActive)
{
    public AirlineData ToData() => new(Name, IataCode, IcaoCode, Callsign, Country, IsActive);
}

public sealed record FleetRequest([Required] IReadOnlyList<string> AircraftTypes);

public sealed record RouteResponse(
    int Id,
    string Origin,
    string? OriginIata,
    string OriginName,
    string Destination,
    string? DestinationIata,
    string DestinationName,
    int DistanceNm);

public sealed record RouteSearch(string? Query, int Page = 1, int PageSize = 20);

public sealed record RouteRequest([Required, MaxLength(16)] string Origin, [Required, MaxLength(16)] string Destination);

public sealed record AirlineImportResult(int AirlinesAdded, int AirlinesUpdated, int RoutesAdded, int RoutesSkipped);