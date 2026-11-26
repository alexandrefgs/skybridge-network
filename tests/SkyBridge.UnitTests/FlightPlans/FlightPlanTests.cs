using SkyBridge.Domain.FlightPlans;

namespace SkyBridge.UnitTests.FlightPlans;

public class FlightPlanTests
{
    private static readonly DateTime Now = new(2026, 11, 24, 18, 0, 0, DateTimeKind.Utc);

    private static FlightPlanData Data(string origin = "SBFL", string destination = "SBGR", string aircraft = "B738", DateTime? generated = null) =>
        new("98765432", generated ?? Now.AddMinutes(-10), "2611", origin, destination, "SBKP", aircraft, "PR-GXA", "GLO1042",
            " PAKOT UZ6 BUXUK ", 36000, 285, 62, 8000, 7800, 4600, 3200, 150, 2000, 60000, 67800, 64600);

    [Fact]
    public void Problems_IsEmpty_WhenTheOfpMatchesTheLeg()
    {
        Assert.Empty(FlightPlan.Problems(Data(), "sbfl", "SBGR", "b738", Now.AddHours(-1)));
    }

    [Fact]
    public void Problems_ListsEveryMismatch()
    {
        var problems = FlightPlan.Problems(Data("SBRJ", "SBSP", "A320", Now.AddHours(-2)), "SBFL", "SBGR", "B738", Now.AddHours(-1));

        Assert.Equal(4, problems.Count);
        Assert.Contains("departs from SBRJ, but this leg departs from SBFL", problems[0]);
        Assert.Contains("arrives at SBSP, but this leg arrives at SBGR", problems[1]);
        Assert.Contains("for a A320, but you booked a B738", problems[2]);
        Assert.Contains("generated before you booked", problems[3]);
    }

    [Fact]
    public void Create_StoresTheLegAndCleansTheData()
    {
        var plan = FlightPlan.Create(7, 2, Data(origin: " sbfl "), Now);

        Assert.Equal((7, 2, "SBFL", "PAKOT UZ6 BUXUK", Now), (plan.BookingId, plan.LegSequence, plan.Origin, plan.Route, plan.ImportedAtUtc));
        Assert.Throws<ArgumentOutOfRangeException>(() => FlightPlan.Create(7, 0, Data(), Now));
    }

    [Fact]
    public void Replace_SwapsTheOfp()
    {
        var plan = FlightPlan.Create(7, 1, Data(), Now);

        plan.Replace(Data() with { SimBriefId = "11111111", BlockFuelKg = 9000 }, Now.AddMinutes(5));

        Assert.Equal(("11111111", 9000, Now.AddMinutes(5)), (plan.SimBriefId, plan.BlockFuelKg, plan.ImportedAtUtc));
    }
    
    [Fact]
    public void Details_AreStoredAndReadBack()
    {
        var details = new FlightPlanDetails(
            new FlightPlanAirport("SBFL", "Hercilio Luz", "14", 16, 7000, 8000, "METAR", null),
            new FlightPlanAirport("SBGR", "Guarulhos", "10L", 2461, 6000, 7000, null, "TAF"),
            null,
            new FlightPlanFuel(200, 3200, 160, 1200, 1100, 140, 5800, 7800, 8000, 4600, 2600),
            new FlightPlanPerformance("30", "PUN04A", "BUXUK1A", null, 290, 25, -12, 3, 452, "0.78", null, "CI 30", null),
            "(FPL-GLO1042)",
            [new NavlogFix("TOC", "TOP OF CLIMB", "ltlg", "UZ6", "CLB", false, 36000, 90, 142, 290, 25, -52, 470, 21, 1500, 6300, -27.1, -48.2)]);

        var plan = FlightPlan.Create(7, 1, Data() with { Details = details }, Now);
        var read = plan.ReadDetails()!;

        Assert.Equal(details.Departure, read.Departure);
        Assert.Equal(details.Fuel, read.Fuel);
        Assert.Equal(details.Navlog[0], read.Navlog[0]);
        Assert.Null(FlightPlan.Create(7, 2, Data(), Now).ReadDetails());
    }
}