namespace SkyBridge.Api.Options;

public sealed class MapOptions
{
    public const string SectionName = "Maps";

    public string? CartoApiKey { get; init; }
}