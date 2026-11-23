namespace SkyBridge.Infrastructure.Persistence;

public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    public string? AdminEmail { get; init; }
    public string? AdminPassword { get; init; }
    public bool ImportAirports { get; init; }
    public bool ImportAirlines { get; init; }
}