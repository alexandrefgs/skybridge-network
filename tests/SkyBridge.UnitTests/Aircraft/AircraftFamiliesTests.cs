using SkyBridge.Domain.Aircraft;

namespace SkyBridge.UnitTests.Aircraft;

public class AircraftFamiliesTests
{
    private static readonly FamilyMember B737 = new(1, "Boeing 737");
    private static readonly FamilyMember B738 = new(2, "Boeing 737");
    private static readonly FamilyMember B38M = new(3, "boeing 737 ");
    private static readonly FamilyMember A320 = new(4, "Airbus A320");
    private static readonly FamilyMember Dash8 = new(5, null);

    [Fact]
    public void Bookable_AddsTheFleetTypesOfTheSameFamily()
    {
        var bookable = AircraftFamilies.Bookable([B737], [B737, B738, B38M, A320]);

        Assert.Equal(new[] { 1, 2, 3 }, bookable.Order());
    }

    [Fact]
    public void Bookable_KeepsTheScheduledTypes_EvenOutsideTheFleet()
    {
        var bookable = AircraftFamilies.Bookable([A320, Dash8], [B738]);

        Assert.Equal(new[] { 4, 5 }, bookable.Order());
    }

    [Fact]
    public void Bookable_IgnoresTypesWithoutFamily()
    {
        var bookable = AircraftFamilies.Bookable([Dash8], [new FamilyMember(6, null), B738]);

        Assert.Equal(new[] { 5 }, bookable);
    }
}