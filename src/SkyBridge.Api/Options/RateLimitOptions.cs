namespace SkyBridge.Api.Options;

public sealed class RateLimitOptions
{
    public const string SectionName = "RateLimiting";
    public const string AuthPolicy = "auth";

    public int AuthPermitPerMinute { get; init; } = 10;
}