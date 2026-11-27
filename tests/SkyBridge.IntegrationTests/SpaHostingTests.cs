using System.Net;
using Microsoft.AspNetCore.Hosting;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public sealed class SpaHostingTests(SkyBridgeApiFactory factory) : IDisposable
{
    private readonly string _webRoot = Directory.CreateTempSubdirectory("skybridge-web").FullName;

    [Fact]
    public async Task Production_ServesAssets_AndFallsBackToIndex_OnlyForClientRoutes()
    {
        await File.WriteAllTextAsync(Path.Combine(_webRoot, "index.html"), "<!doctype html><title>SkyBridge</title>");
        await File.WriteAllTextAsync(Path.Combine(_webRoot, "main-TEST.js"), "console.log('skybridge');");

        var client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting(WebHostDefaults.WebRootKey, _webRoot);
            builder.UseSetting("Jwt:Key", new string('k', 64));
        }).CreateClient();

        var script = await client.GetAsync("/main-TEST.js");
        var route = await client.GetAsync("/operations");
        var missingFile = await client.GetAsync("/missing-TEST.js");
        var missingApi = await client.GetAsync("/api/missing");

        Assert.Equal(HttpStatusCode.OK, script.StatusCode);
        Assert.Contains("javascript", script.Content.Headers.ContentType?.MediaType);
        Assert.Equal(HttpStatusCode.OK, route.StatusCode);
        Assert.Equal("text/html", route.Content.Headers.ContentType?.MediaType);
        Assert.Equal(HttpStatusCode.NotFound, missingFile.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missingApi.StatusCode);
    }

    public void Dispose() => Directory.Delete(_webRoot, recursive: true);
}