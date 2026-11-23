using SkyBridge.Domain.Geography;

namespace SkyBridge.UnitTests.Airlines;

public class GreatCircleTests
{
    [Fact]
    public void DistanceNm_FlorianopolisToGuarulhos()
    {
        Assert.Equal(278, GreatCircle.DistanceNm(-27.670279, -48.552502, -23.431944, -46.467778));
    }

    [Fact]
    public void DistanceNm_IsZeroForTheSamePoint()
    {
        Assert.Equal(0, GreatCircle.DistanceNm(-27.67, -48.55, -27.67, -48.55));
    }

    [Fact]
    public void DistanceNm_IsSymmetric()
    {
        var there = GreatCircle.DistanceNm(-23.431944, -46.467778, 51.4706, -0.461941);
        var back = GreatCircle.DistanceNm(51.4706, -0.461941, -23.431944, -46.467778);

        Assert.Equal(there, back);
        Assert.InRange(there, 5090, 5120);
    }
}