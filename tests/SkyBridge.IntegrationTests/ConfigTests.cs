using System.Net.Http.Json;
using SkyBridge.Api.Controllers;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class ConfigTests(SkyBridgeApiFactory factory)
{
    [Fact]
    public async Task Client_ReturnsMapKey_WithoutAuthentication()
    {
        var client = factory.CreateClient();

        var config = await client.GetFromJsonAsync<ClientConfigResponse>("/api/config/client");

        Assert.Equal("test-carto-key", config!.CartoApiKey);
        Assert.Equal(("privacy@skybridge.test", "https://discord.gg/skybridge"), (config.ContactEmail, config.DiscordUrl));
        Assert.Equal("https://instagram.com/skybridge", config.InstagramUrl);
    }
}