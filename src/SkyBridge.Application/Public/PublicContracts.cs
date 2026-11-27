namespace SkyBridge.Application.Public;

public sealed record PublicStatsResponse(
    int TotalFlights,
    int FlightsThisMonth,
    int? OnlineVatsim,
    int? OnlineIvao,
    int Aircraft,
    int Destinations,
    int Pilots,
    int Airlines);

public sealed record PublicFlightResponse(
    int Id,
    string? FlightNumber,
    string? Airline,
    string? Mission,
    string Origin,
    string OriginName,
    string Destination,
    string DestinationName,
    string Aircraft,
    string AircraftModel,
    string Pilot,
    int FlightMinutes,
    int? LandingRateFpm,
    DateTime ArrivedAtUtc);

public sealed record LiveAirportResponse(string Code, string Name, double Latitude, double Longitude);

public sealed record LiveFlightResponse(
    string Network,
    int NetworkId,
    string Callsign,
    string Pilot,
    double Latitude,
    double Longitude,
    int AltitudeFt,
    int GroundSpeedKt,
    int Heading,
    string? Aircraft,
    string? AircraftModel,
    string? Mission,
    string? Airline,
    LiveAirportResponse? Origin,
    LiveAirportResponse? Destination);

public sealed record LiveMapResponse(
    DateTime UpdatedAtUtc,
    bool VatsimAvailable,
    bool IvaoAvailable,
    IReadOnlyList<LiveFlightResponse> Flights);

public interface IPublicQueries
{
    Task<PublicStatsResponse> GetStatsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<PublicFlightResponse>> GetRecentFlightsAsync(int count, CancellationToken cancellationToken);
    Task<LiveMapResponse> GetLiveMapAsync(CancellationToken cancellationToken);
}

public sealed record NetworkPilot(
    int Id,
    string Callsign,
    double? Latitude,
    double? Longitude,
    int AltitudeFt,
    int GroundSpeedKt,
    int Heading,
    string? Departure,
    string? Arrival,
    string? Aircraft)
{
    public bool HasPosition => Latitude is not null && Longitude is not null;
}

public sealed record OnlinePilots(IReadOnlyDictionary<int, NetworkPilot>? Vatsim, IReadOnlyDictionary<int, NetworkPilot>? Ivao);

public interface IOnlineNetworks
{
    Task<OnlinePilots> GetOnlinePilotsAsync(CancellationToken cancellationToken);
}