namespace SkyBridge.Application.Legal;

public sealed record RegulationsVersion(int Version, DateOnly EffectiveOn, IReadOnlyList<string> Changes);

public static class RegulationsCatalog
{
    public static readonly IReadOnlyList<RegulationsVersion> History =
    [
        new(1, new DateOnly(2026, 11, 27),
        [
            "First edition of the SkyBridge Regulations and Privacy Policy.",
            "Minimum age of 16, PIREP rules, conduct, inactivity after 60 days and data kept for 12 months."
        ])
    ];

    public static RegulationsVersion Current => History[^1];

    public static IReadOnlyList<RegulationsVersion> Since(int? acceptedVersion) =>
        History.Where(v => v.Version > (acceptedVersion ?? 0)).ToList();
}

public sealed record RegulationsResponse(int CurrentVersion, IReadOnlyList<RegulationsVersion> History);