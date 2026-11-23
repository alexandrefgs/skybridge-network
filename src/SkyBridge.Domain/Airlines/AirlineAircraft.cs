namespace SkyBridge.Domain.Airlines;

public sealed class AirlineAircraft
{
    private AirlineAircraft() { }

    internal AirlineAircraft(int aircraftTypeId) => AircraftTypeId = aircraftTypeId;

    public int AirlineId { get; private set; }
    public int AircraftTypeId { get; private set; }
}