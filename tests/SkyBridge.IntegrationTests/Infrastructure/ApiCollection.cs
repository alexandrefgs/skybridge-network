namespace SkyBridge.IntegrationTests.Infrastructure;

[CollectionDefinition(Name)]
public class ApiCollection : ICollectionFixture<SkyBridgeApiFactory>
{
    public const string Name = "Api";
}