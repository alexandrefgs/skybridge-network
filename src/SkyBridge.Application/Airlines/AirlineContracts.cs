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
    IReadOnlyList<FleetTypeResponse> Fleet,
    DateTimeOffset? RoutesUpdatedAtUtc,
    string? RoutesSource,
    DateOnly? RoutesEdition);

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
    int DistanceNm,
    IReadOnlyList<string> Aircraft,
    string? AtsRoute,
    int? FlightLevel);

public sealed record RouteSearch(string? Query, int Page = 1, int PageSize = 20);

public sealed record RouteRequest(
    [Required, MaxLength(16)] string Origin,
    [Required, MaxLength(16)] string Destination,
    IReadOnlyList<string>? Aircraft = null,
    [MaxLength(500)] string? AtsRoute = null,
    [Range(10, 600)] int? FlightLevel = null);

public sealed record RouteDetailsRequest(
    IReadOnlyList<string>? Aircraft,
    [MaxLength(500)] string? AtsRoute,
    [Range(10, 600)] int? FlightLevel);

public sealed record RouteImportIssue(int Line, string Message);

public sealed record RouteImportResult(
    string Format,
    DateOnly? Edition,
    int Added,
    int Updated,
    int Unchanged,
    int Skipped,
    IReadOnlyList<string> FleetAdded,
    IReadOnlyList<RouteImportIssue> Issues);

public sealed record AirlineImportResult(int AirlinesAdded, int AirlinesUpdated, int RoutesAdded, int RoutesSkipped);