namespace SkyBridge.Domain.Bookings;

public sealed record AirlineFlight(
    int RouteId,
    string FlightNumber,
    string AirlineName,
    int OriginAirportId,
    int DestinationAirportId,
    int DistanceNm);