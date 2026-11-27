using SkyBridge.Application.Legal;

namespace SkyBridge.UnitTests.Legal;

public class RegulationsCatalogTests
{
    [Fact]
    public void History_GrowsOneVersionAtATime_WithWhatChanged()
    {
        Assert.All(RegulationsCatalog.History.Select((version, index) => (version, index)), item =>
        {
            Assert.Equal(item.index + 1, item.version.Version);
            Assert.NotEmpty(item.version.Changes);
        });
        Assert.Equal(RegulationsCatalog.History.Count, RegulationsCatalog.Current.Version);
    }

    [Fact]
    public void Since_ListsOnlyTheVersionsThePilotHasNotAccepted()
    {
        Assert.Equal(RegulationsCatalog.History.Count, RegulationsCatalog.Since(null).Count);
        Assert.Empty(RegulationsCatalog.Since(RegulationsCatalog.Current.Version));
    }
}