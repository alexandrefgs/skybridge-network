using SkyBridge.Domain.Aircraft;

namespace SkyBridge.UnitTests.Aircraft;

public class AircraftCategoryTests
{
    [Fact]
    public void IsUnlockedFor_RequiresTheMinimumHours()
    {
        var turboprop = AircraftCategory.Create(AircraftCategoryCode.Turboprop, "Turboprop", 25, 130);

        Assert.False(turboprop.IsUnlockedFor(24.9m));
        Assert.True(turboprop.IsUnlockedFor(25m));
        Assert.Equal(130, turboprop.PayPerHour);
    }

    [Fact]
    public void Update_RejectsNegativeHoursOrPay()
    {
        var heavy = AircraftCategory.Create(AircraftCategoryCode.Heavy, "Heavy", 600, 450);

        Assert.Throws<ArgumentOutOfRangeException>(() => heavy.Update("Heavy", -1, 450));
        Assert.Throws<ArgumentOutOfRangeException>(() => heavy.Update("Heavy", 600, -1));

        heavy.Update(" Heavy (wide-body) ", 650, 500);
        Assert.Equal(("Heavy (wide-body)", 650, 500), (heavy.Name, heavy.RequiredHours, heavy.PayPerHour));
    }
}