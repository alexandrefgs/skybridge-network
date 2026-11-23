namespace SkyBridge.Domain.Routes;

public sealed class RouteAircraft
{
    private RouteAircraft() { }

    internal RouteAircraft(int aircraftTypeId) => AircraftTypeId = aircraftTypeId;

    public int RouteId { get; private set; }
    public int AircraftTypeId { get; private set; }
}