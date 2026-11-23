using SkyBridge.Domain.Bookings;

namespace SkyBridge.UnitTests.Bookings;

public class BookingTests
{
    private static readonly DateTime Now = new(2026, 11, 23, 12, 0, 0, DateTimeKind.Utc);
    private static readonly Guid PilotId = Guid.NewGuid();

    private static Booking Accepted(int legs = 2) => Booking.ForFreelanceJob(PilotId, 7, 3, legs, 900, Now.AddDays(1), Now);

    [Fact]
    public void ForFreelanceJob_StartsActive_OnTheFirstLeg()
    {
        var booking = Accepted();

        Assert.Equal((BookingStatus.Active, BookingSource.Freelance, 1, 2), (booking.Status, booking.Source, booking.CurrentLeg, booking.LegCount));
        Assert.Equal((7, 3), (booking.FreelanceJobId!.Value, booking.AircraftTypeId));
        Assert.False(booking.LegInProgress);
        Assert.Equal(Now.AddDays(1), booking.StartDeadlineUtc);
    }

    [Fact]
    public void ForFreelanceJob_RejectsAnExpiredJob()
    {
        Assert.Throws<InvalidOperationException>(() => Booking.ForFreelanceJob(PilotId, 7, 3, 1, 900, Now, Now));
    }

    [Fact]
    public void StartLeg_MarksTheLegAndTheMissionAsStarted()
    {
        var booking = Accepted();

        booking.StartLeg(Now.AddHours(2));

        Assert.True(booking.LegInProgress);
        Assert.Equal(Now.AddHours(2), booking.StartedAtUtc);
        Assert.Throws<InvalidOperationException>(() => booking.StartLeg(Now.AddHours(3)));
    }

    [Fact]
    public void StartLeg_FailsAfterTheDeadline_WhenTheMissionNeverStarted()
    {
        var booking = Accepted();

        Assert.True(booking.IsOverdue(Now.AddDays(1)));
        Assert.Throws<InvalidOperationException>(() => booking.StartLeg(Now.AddDays(1)));
    }

    [Fact]
    public void IsOverdue_IsFalse_OnceTheMissionStarted()
    {
        var booking = Accepted();
        booking.StartLeg(Now.AddHours(1));

        Assert.False(booking.IsOverdue(Now.AddDays(5)));
    }

    [Fact]
    public void Expire_OnlyWorksWhenOverdue()
    {
        var booking = Accepted();

        Assert.Throws<InvalidOperationException>(() => booking.Expire(Now.AddHours(1)));
        booking.Expire(Now.AddDays(2));

        Assert.Equal(BookingStatus.Expired, booking.Status);
        Assert.Equal(Now.AddDays(2), booking.FinishedAtUtc);
    }

    [Fact]
    public void Cancel_EndsTheBooking_EvenDuringALeg()
    {
        var booking = Accepted();
        booking.StartLeg(Now.AddHours(1));

        booking.Cancel(Now.AddHours(2));

        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.False(booking.LegInProgress);
        Assert.Throws<InvalidOperationException>(() => booking.Cancel(Now.AddHours(3)));
    }
    
    [Fact]
    public void CompleteLeg_MovesToTheNextLeg_ThenCompletesTheMission()
    {
        var booking = Accepted();
        Assert.Throws<InvalidOperationException>(() => booking.CompleteLeg(Now));

        booking.StartLeg(Now.AddHours(1));
        booking.CompleteLeg(Now.AddHours(2));

        Assert.Equal((BookingStatus.Active, 2, false), (booking.Status, booking.CurrentLeg, booking.LegInProgress));
        Assert.Throws<InvalidOperationException>(() => booking.MarkRewardPaid(Now.AddHours(2)));

        booking.StartLeg(Now.AddHours(3));
        booking.CompleteLeg(Now.AddHours(4));

        Assert.Equal((BookingStatus.Completed, 2), (booking.Status, booking.CurrentLeg));
        Assert.Equal(Now.AddHours(4), booking.FinishedAtUtc);
        Assert.Equal(900, booking.Reward);
    }

    [Fact]
    public void MarkRewardPaid_OnlyOnce()
    {
        var booking = Accepted(legs: 1);
        booking.StartLeg(Now.AddHours(1));
        booking.CompleteLeg(Now.AddHours(2));

        booking.MarkRewardPaid(Now.AddHours(2));

        Assert.Equal(Now.AddHours(2), booking.RewardPaidAtUtc);
        Assert.Throws<InvalidOperationException>(() => booking.MarkRewardPaid(Now.AddHours(3)));
    }    
    private static readonly AirlineFlight Flight = new(42, "GLO1042", "Gol Transportes Aéreos", 10, 20, 278);

    [Fact]
    public void ForAirlineFlight_HasOneLeg_AndTwentyFourHoursToStart()
    {
        var booking = Booking.ForAirlineFlight(PilotId, Flight, 3, 60, Now);

        Assert.Equal((BookingSource.Airline, BookingStatus.Active, 1, 1), (booking.Source, booking.Status, booking.CurrentLeg, booking.LegCount));
        Assert.Equal((42, "GLO1042", "Gol Transportes Aéreos"), (booking.RouteId!.Value, booking.FlightNumber!, booking.AirlineName!));
        Assert.Equal((10, 20, 278, 60), (booking.OriginAirportId!.Value, booking.DestinationAirportId!.Value, booking.DistanceNm, booking.PayPerHour));
        Assert.Equal(Now.AddHours(24), booking.StartDeadlineUtc);
        Assert.Null(booking.FreelanceJobId);
        Assert.True(booking.IsOverdue(Now.AddHours(24)));
    }

    [Fact]
    public void ForAirlineFlight_RejectsTheSameAirport()
    {
        Assert.Throws<ArgumentException>(() => Booking.ForAirlineFlight(PilotId, Flight with { DestinationAirportId = 10 }, 3, 60, Now));
    }

    [Theory]
    [InlineData("glo", "G3", 42, "GLO1042")]
    [InlineData(null, "g3", 9001, "G31001")]
    [InlineData(null, null, 7, "SKB1007")]
    public void FlightNumberFor_UsesTheAirlineCode(string? icao, string? iata, int routeId, string expected)
    {
        Assert.Equal(expected, Booking.FlightNumberFor(icao, iata, routeId));
    }

    [Fact]
    public void PayFor_PaysTheHourlyRateByTheMinute()
    {
        var booking = Booking.ForAirlineFlight(PilotId, Flight, 3, 60, Now);

        Assert.Equal(140, booking.PayFor(140));
        Assert.Equal(83, booking.PayFor(83));
        Assert.Equal(0, Booking.ForAirlineFlight(PilotId, Flight, 3, 0, Now).PayFor(140));
        Assert.Equal(2, Booking.ForAirlineFlight(PilotId, Flight, 3, 90, Now).PayFor(1));
    }
}