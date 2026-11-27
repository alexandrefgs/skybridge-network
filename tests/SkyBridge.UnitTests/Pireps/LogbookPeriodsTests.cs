using SkyBridge.Application.Pireps;

namespace SkyBridge.UnitTests.Pireps;

public class LogbookPeriodsTests
{
    private static readonly DateTime Now = new(2026, 11, 26, 12, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData(null, "30d")]
    [InlineData(" 30D ", "30d")]
    [InlineData("1y", "1y")]
    public void TrySince_StartsThePeriodBackFromNow(string? period, string expected)
    {
        Assert.True(LogbookPeriods.TrySince(period, Now, out var normalized, out var since));

        Assert.Equal(expected, normalized);
        Assert.Equal(expected == "30d" ? Now.AddDays(-30) : Now.AddYears(-1), since);
    }

    [Fact]
    public void TrySince_HasNoStart_ForAll()
    {
        Assert.True(LogbookPeriods.TrySince("all", Now, out _, out var since));
        Assert.Null(since);
    }

    [Fact]
    public void TrySince_RejectsUnknownPeriods()
    {
        Assert.False(LogbookPeriods.TrySince("week", Now, out _, out _));
    }
}