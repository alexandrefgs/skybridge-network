using System.Text.RegularExpressions;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Geography;

namespace SkyBridge.Domain.Routes;

public sealed partial class Route
{
    public const int MaxAtsRouteLength = 500;
    public const int MinFlightLevel = 10;
    public const int MaxFlightLevel = 600;

    private readonly List<RouteAircraft> _aircraft = [];

    private Route() { }

    public int Id { get; private set; }
    public int AirlineId { get; private set; }
    public int OriginAirportId { get; private set; }
    public int DestinationAirportId { get; private set; }
    public int DistanceNm { get; private set; }
    public string? AtsRoute { get; private set; }
    public int? FlightLevel { get; private set; }
    public IReadOnlyCollection<RouteAircraft> Aircraft => _aircraft;

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

    public bool SetDetails(string? atsRoute, int? flightLevel)
    {
        var route = NormalizeAtsRoute(atsRoute);
        if (route is { Length: > MaxAtsRouteLength })
            throw new ArgumentException($"Route must have at most {MaxAtsRouteLength} characters.", nameof(atsRoute));
        if (flightLevel is < MinFlightLevel or > MaxFlightLevel)
            throw new ArgumentOutOfRangeException(nameof(flightLevel), $"Flight level must be between {MinFlightLevel} and {MaxFlightLevel}.");

        if (AtsRoute == route && FlightLevel == flightLevel)
            return false;

        AtsRoute = route;
        FlightLevel = flightLevel;
        return true;
    }

    public bool SetAircraft(IEnumerable<int> aircraftTypeIds)
    {
        var wanted = aircraftTypeIds.ToHashSet();
        var removed = _aircraft.RemoveAll(entry => !wanted.Contains(entry.AircraftTypeId));
        var added = wanted.Where(id => _aircraft.All(entry => entry.AircraftTypeId != id)).ToList();
        foreach (var id in added)
            _aircraft.Add(new RouteAircraft(id));
        return removed > 0 || added.Count > 0;
    }

    public static string? NormalizeAtsRoute(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        return Spaces().Replace(value.Trim(), " ").ToUpperInvariant();
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}