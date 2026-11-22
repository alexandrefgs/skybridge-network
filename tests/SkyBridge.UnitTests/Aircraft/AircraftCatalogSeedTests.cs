using SkyBridge.Domain.Aircraft;
using SkyBridge.Infrastructure.Persistence.Seed;

namespace SkyBridge.UnitTests.Aircraft;

public class AircraftCatalogSeedTests
{
    [Fact]
    public void Categories_FollowTheProposedProgression()
    {
        var hours = AircraftCatalogSeed.Categories().Select(c => c.RequiredHours);

        Assert.Equal(new[] { 0, 0, 25, 75, 75, 150, 300, 300, 600 }, hours);
    }

    [Fact]
    public void Types_AreValidUniqueAndCoverEveryCategory()
    {
        var types = AircraftCatalogSeed.Types.Select(AircraftType.Create).ToList();

        Assert.Equal(types.Count, types.Select(t => t.IcaoCode).Distinct().Count());
        Assert.All(Enum.GetValues<AircraftCategoryCode>(), category => Assert.Contains(types, t => t.Category == category));
    }
}