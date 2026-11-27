namespace SkyBridge.Api.Options;

public sealed class SiteOptions
{
    public const string SectionName = "Site";

    public string? ContactEmail { get; init; }
    public string? DiscordUrl { get; init; }
    public string? InstagramUrl { get; init; }
}