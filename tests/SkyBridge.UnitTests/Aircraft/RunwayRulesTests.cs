using SkyBridge.Domain.Aircraft;

namespace SkyBridge.UnitTests.Aircraft;

public class RunwayRulesTests
{
    [Theory]
    [InlineData(4300, true, 4341, 4341, RunwayFit.Ok)]
    [InlineData(6500, true, 6365, 6365, RunwayFit.TooShort)]
    [InlineData(4300, true, 5000, null, RunwayFit.NeedsPaved)]
    [InlineData(4300, true, 5000, 3000, RunwayFit.NeedsPaved)]
    [InlineData(4300, true, 3000, null, RunwayFit.TooShort)]
    [InlineData(1700, false, 2500, null, RunwayFit.Ok)]
    [InlineData(1700, false, 1200, null, RunwayFit.TooShort)]
    [InlineData(4300, true, null, null, RunwayFit.NoData)]
    public void Check_ComparesLengthAndSurface(int minRunway, bool requiresPaved, int? longest, int? longestHard, RunwayFit expected)
    {
        Assert.Equal(expected, RunwayRules.Check(minRunway, requiresPaved, longest, longestHard));
    }
}