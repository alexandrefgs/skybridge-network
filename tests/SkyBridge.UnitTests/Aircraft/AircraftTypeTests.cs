using SkyBridge.Domain.Aircraft;

namespace SkyBridge.UnitTests.Aircraft;

public class AircraftTypeTests
{
    private static AircraftTypeData Boeing738() =>
        new("B738", "Boeing", "737-800", AircraftCategoryCode.Medium, EngineType.Jet, 2, 2935, 453, 41000, 189, 4500);

    [Fact]
    public void Create_NormalizesIcaoCode()
    {
        var type = AircraftType.Create(Boeing738() with { IcaoCode = " b738 " });

        Assert.Equal("B738", type.IcaoCode);
    }

    [Theory]
    [InlineData("B7380")]
    [InlineData("B-38")]
    [InlineData("")]
    public void Create_RejectsInvalidIcaoCode(string icaoCode)
    {
        Assert.Throws<ArgumentException>(() => AircraftType.Create(Boeing738() with { IcaoCode = icaoCode }));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1000)]
    public void Create_RejectsServiceCeilingBelowOne(int ceiling)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => AircraftType.Create(Boeing738() with { ServiceCeilingFt = ceiling }));
    }

    [Fact]
    public void CanFly_ComparesDistanceWithRange()
    {
        var type = AircraftType.Create(Boeing738());

        Assert.True(type.CanFly(2500));
        Assert.False(type.CanFly(3000));
    }
}