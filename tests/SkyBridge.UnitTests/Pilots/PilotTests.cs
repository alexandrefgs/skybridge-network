using SkyBridge.Domain.Pilots;

namespace SkyBridge.UnitTests.Pilots;

public class PilotTests
{
    [Fact]
    public void Create_StartsWithoutLocationOrHours()
    {
        var pilot = Pilot.Create(Guid.NewGuid());

        Assert.Null(pilot.CurrentAirportId);
        Assert.Equal(0m, pilot.FlightHours);
    }

    [Fact]
    public void Create_RejectsEmptyUser()
    {
        Assert.Throws<ArgumentException>(() => Pilot.Create(Guid.Empty));
    }

    [Fact]
    public void MoveTo_ChangesTheCurrentAirport()
    {
        var pilot = Pilot.Create(Guid.NewGuid());

        pilot.MoveTo(42);
        pilot.MoveTo(7);

        Assert.Equal(7, pilot.CurrentAirportId);
    }
    
    [Fact]
    public void LogFlight_AddsMinutes_AndCreditAddsMoney()
    {
        var pilot = Pilot.Create(Guid.NewGuid());

        pilot.LogFlight(90);
        pilot.LogFlight(48);
        pilot.Credit(1500);

        Assert.Equal(138, pilot.FlightMinutes);
        Assert.Equal(2.3m, pilot.FlightHours);
        Assert.Equal(1500, pilot.Balance);
        Assert.Throws<ArgumentOutOfRangeException>(() => pilot.LogFlight(0));
        Assert.Throws<ArgumentOutOfRangeException>(() => pilot.Credit(-10));
    }

    [Fact]
    public void Transaction_KeepsTheAmountAndTrimsTheDescription()
    {
        var now = new DateTime(2026, 11, 23, 12, 0, 0, DateTimeKind.Utc);
        var transaction = PilotTransaction.Create(Guid.NewGuid(), 900, "  Freelance job #7 completed ", 3, now);

        Assert.Equal((900, "Freelance job #7 completed", 3, now), (transaction.Amount, transaction.Description, transaction.BookingId!.Value, transaction.CreatedAtUtc));
        Assert.Throws<ArgumentOutOfRangeException>(() => PilotTransaction.Create(Guid.NewGuid(), 0, "x", null, now));
        Assert.Throws<ArgumentException>(() => PilotTransaction.Create(Guid.NewGuid(), 10, " ", null, now));
    }
}