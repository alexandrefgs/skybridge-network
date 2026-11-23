namespace SkyBridge.Domain.Pilots;

public sealed class Pilot
{
    private Pilot() { }

    public Guid UserId { get; private set; }
    public int? CurrentAirportId { get; private set; }
    public int FlightMinutes { get; private set; }
    public int Balance { get; private set; }

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