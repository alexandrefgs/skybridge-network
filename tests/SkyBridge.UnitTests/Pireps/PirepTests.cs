using SkyBridge.Domain.Pireps;

namespace SkyBridge.UnitTests.Pireps;

public class PirepTests
{
    private static readonly DateTime Now = new(2026, 11, 23, 18, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime LegStarted = Now.AddHours(-3);

    private static PirepLeg Leg(int distanceNm = 278, int cruise = 124) =>
        new(5, Guid.NewGuid(), 1, 10, 20, distanceNm, 3, "C172", cruise, LegStarted);

    private static PirepTimes Times(DateTime departed, DateTime arrived, int? landingRate = 180, string? remarks = null) =>
        new(departed, arrived, 40, landingRate, remarks);

    [Fact]
    public void File_IsAccepted_WhenTheTimesMakeSense()
    {
        var pirep = Pirep.File(Leg(), Times(LegStarted.AddMinutes(10), LegStarted.AddMinutes(150), remarks: "  Smooth flight "), Now);

        Assert.Equal(PirepStatus.Accepted, pirep.Status);
        Assert.Null(pirep.Flag);
        Assert.Equal(140, pirep.FlightMinutes);
        Assert.Equal((5, 1, 10, 20, 278, 3), (pirep.BookingId, pirep.LegSequence, pirep.OriginAirportId, pirep.DestinationAirportId, pirep.DistanceNm, pirep.AircraftTypeId));
        Assert.Equal("Smooth flight", pirep.Remarks);
        Assert.Equal(Now, pirep.FiledAtUtc);
    }

    [Fact]
    public void File_IsPending_WhenTheFlightIsTooFastForTheAircraft()
    {
        var pirep = Pirep.File(Leg(), Times(LegStarted.AddMinutes(10), LegStarted.AddMinutes(60)), Now);

        Assert.Equal(PirepStatus.Pending, pirep.Status);
        Assert.Equal("50 min is too short for 278 nm in a C172 (about 135 min expected).", pirep.Flag);
    }

    [Fact]
    public void File_IsPending_WhenTakeoffIsLongBeforeTheLegStarted()
    {
        var pirep = Pirep.File(Leg(), Times(LegStarted.AddHours(-2), LegStarted.AddMinutes(30)), Now);

        Assert.Equal(PirepStatus.Pending, pirep.Status);
        Assert.Equal("Takeoff is before the leg was started.", pirep.Flag);
    }

    [Fact]
    public void File_AcceptsAShortSkydivingLoop()
    {
        var pirep = Pirep.File(Leg(distanceNm: 0), Times(LegStarted.AddMinutes(5), LegStarted.AddMinutes(25)), Now);

        Assert.Equal(PirepStatus.Accepted, pirep.Status);
    }

    [Theory]
    [InlineData(-60, -70, "Landing must be after takeoff.")]
    [InlineData(-60, 60, "Landing time can't be in the future.")]
    [InlineData(-1500, 0, "A leg can't last more than 24 hours.")]
    public void File_RejectsImpossibleTimes(int departedMinutes, int arrivedMinutes, string message)
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            Pirep.File(Leg(), Times(Now.AddMinutes(departedMinutes), Now.AddMinutes(arrivedMinutes)), Now));

        Assert.StartsWith(message, exception.Message);
    }

    [Fact]
    public void File_RejectsABadLandingRate()
    {
        Assert.Throws<ArgumentException>(() => Pirep.File(Leg(), Times(LegStarted, LegStarted.AddMinutes(150), landingRate: 9000), Now));
    }

    [Fact]
    public void Review_ApprovesOrRejectsOnlyPendingPireps()
    {
        var accepted = Pirep.File(Leg(), Times(LegStarted.AddMinutes(10), LegStarted.AddMinutes(150)), Now);
        Assert.Throws<InvalidOperationException>(() => accepted.Approve(Now, null));

        var approved = Pirep.File(Leg(), Times(LegStarted.AddMinutes(10), LegStarted.AddMinutes(60)), Now);
        approved.Approve(Now.AddHours(1), " Tailwind ");
        Assert.Equal((PirepStatus.Accepted, "Tailwind", Now.AddHours(1)), (approved.Status, approved.ReviewNote!, approved.ReviewedAtUtc!.Value));

        var rejected = Pirep.File(Leg(), Times(LegStarted.AddMinutes(10), LegStarted.AddMinutes(60)), Now);
        Assert.Throws<ArgumentException>(() => rejected.Reject(Now, " "));
        rejected.Reject(Now, "Slew mode used.");
        Assert.Equal(PirepStatus.Rejected, rejected.Status);
    }

    [Fact]
    public void ExpectedMinutes_UsesTheCruiseSpeed()
    {
        Assert.Equal(135, Pirep.ExpectedMinutes(278, 124));
        Assert.Equal(0, Pirep.ExpectedMinutes(100, 0));
    }
}