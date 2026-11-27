namespace SkyBridge.Domain.Pilots;

public sealed class Pilot
{
    public const int MaxNetworkId = 99_999_999;

    private Pilot() { }

    public Guid UserId { get; private set; }
    public int? CurrentAirportId { get; private set; }
    public int FlightMinutes { get; private set; }
    public int Balance { get; private set; }
    public string? SimBriefPilotId { get; private set; }
    public int? VatsimId { get; private set; }
    public int? IvaoId { get; private set; }

    public decimal FlightHours => Math.Round(FlightMinutes / 60m, 1);

    public static Pilot Create(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("Pilot needs a user.", nameof(userId));

        return new Pilot { UserId = userId };
    }

    public void MoveTo(int airportId)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(airportId, 1);
        CurrentAirportId = airportId;
    }

    public void LinkSimBrief(string? pilotId)
    {
        if (string.IsNullOrWhiteSpace(pilotId))
        {
            SimBriefPilotId = null;
            return;
        }

        var value = pilotId.Trim();
        if (value.Length > 7 || !value.All(char.IsAsciiDigit))
            throw new ArgumentException("The SimBrief Pilot ID has 1 to 7 digits.", nameof(pilotId));

        SimBriefPilotId = value;
    }

    public void LinkNetworks(int? vatsimId, int? ivaoId)
    {
        if (vatsimId is < 1 or > MaxNetworkId)
            throw new ArgumentOutOfRangeException(nameof(vatsimId), "The VATSIM CID has 1 to 8 digits.");
        if (ivaoId is < 1 or > MaxNetworkId)
            throw new ArgumentOutOfRangeException(nameof(ivaoId), "The IVAO VID has 1 to 8 digits.");

        VatsimId = vatsimId;
        IvaoId = ivaoId;
    }
    
    public void LogFlight(int minutes)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(minutes);
        FlightMinutes += minutes;
    }

    public void Credit(int amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);
        Balance += amount;
    }
}