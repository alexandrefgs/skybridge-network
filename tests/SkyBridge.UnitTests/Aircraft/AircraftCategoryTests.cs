using SkyBridge.Domain.Aircraft;

namespace SkyBridge.UnitTests.Aircraft;

public class AircraftCategoryTests
{
    [Fact]
    public void IsUnlockedFor_RequiresTheMinimumHours()
    {
        var turboprop = AircraftCategory.Create(AircraftCategoryCode.Turboprop, "Turboprop", 25);

        Assert.False(turboprop.IsUnlockedFor(24.9m));
        Assert.True(turboprop.IsUnlockedFor(25m));
    }

    [Fact]
    public void Update_RejectsNegativeHours()
    {
        var heavy = AircraftCategory.Create(AircraftCategoryCode.Heavy, "Heavy", 600);

        Assert.Throws<ArgumentOutOfRangeException>(() => heavy.Update("Heavy", -1));
    }
}