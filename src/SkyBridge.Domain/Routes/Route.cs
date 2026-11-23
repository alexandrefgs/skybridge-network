using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Geography;

namespace SkyBridge.Domain.Routes;

public sealed class Route
{
    private Route() { }

    public int Id { get; private set; }
    public int AirlineId { get; private set; }
    public int OriginAirportId { get; private set; }
    public int DestinationAirportId { get; private set; }
    public int DistanceNm { get; private set; }

    public static Route Create(int airlineId, Airport origin, Airport destination) =>
        Create(airlineId, origin.Id, origin.Latitude, origin.Longitude, destination.Id, destination.Latitude, destination.Longitude);

    public static Route Create(int airlineId, int originId, double originLatitude, double originLongitude,
        int destinationId, double destinationLatitude, double destinationLongitude)
    {
        if (originId == destinationId)
            throw new ArgumentException("Origin and destination must be different airports.");

        return new Route
        {
            AirlineId = airlineId,
            OriginAirportId = originId,
            DestinationAirportId = destinationId,
            DistanceNm = GreatCircle.DistanceNm(originLatitude, originLongitude, destinationLatitude, destinationLongitude)
        };
    }
}