namespace SkyBridge.Domain.Freelance;

public sealed class FreelanceJobAircraft
{
    private FreelanceJobAircraft() { }

    internal FreelanceJobAircraft(int aircraftTypeId) => AircraftTypeId = aircraftTypeId;

    public int FreelanceJobId { get; private set; }
    public int AircraftTypeId { get; private set; }
}