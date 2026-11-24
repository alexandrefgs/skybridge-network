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
}