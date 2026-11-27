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

public interface IPublicQueries
{
    Task<PublicStatsResponse> GetStatsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<PublicFlightResponse>> GetRecentFlightsAsync(int count, CancellationToken cancellationToken);
}

public sealed record OnlinePilots(IReadOnlySet<int>? Vatsim, IReadOnlySet<int>? Ivao);

public interface IOnlineNetworks
{
    Task<OnlinePilots> GetOnlinePilotsAsync(CancellationToken cancellationToken);
}