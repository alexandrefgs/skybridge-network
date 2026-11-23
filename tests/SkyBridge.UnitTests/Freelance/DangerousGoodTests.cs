using SkyBridge.Domain.Freelance;

namespace SkyBridge.UnitTests.Freelance;

public class DangerousGoodTests
{
    [Theory]
    [InlineData("UN1203", "UN1203")]
    [InlineData("un 1203", "UN1203")]
    [InlineData("1203", "UN1203")]
    [InlineData(null, null)]
    [InlineData("  ", null)]
    public void Create_NormalizesTheUnNumber(string? input, string? expected)
    {
        var good = DangerousGood.Create(" Gasoline ", DangerousGoodClass.FlammableLiquids, 200, input);

        Assert.Equal(("Gasoline", expected), (good.Name, good.UnNumber));
    }

    [Theory]
    [InlineData("UN12")]
    [InlineData("ABC")]
    public void Create_RejectsInvalidUnNumbers(string unNumber)
    {
        Assert.Throws<ArgumentException>(() => DangerousGood.Create("Gasoline", DangerousGoodClass.FlammableLiquids, 200, unNumber));
    }

    [Fact]
    public void Create_RejectsMissingNameAndNegativeQuantity()
    {
        Assert.Throws<ArgumentException>(() => DangerousGood.Create(" ", DangerousGoodClass.Gases, 10, null));
        Assert.Throws<ArgumentOutOfRangeException>(() => DangerousGood.Create("Oxygen", DangerousGoodClass.Gases, -1, null));
        Assert.Throws<ArgumentOutOfRangeException>(() => DangerousGood.Create("Oxygen", (DangerousGoodClass)12, 10, null));
    }
}