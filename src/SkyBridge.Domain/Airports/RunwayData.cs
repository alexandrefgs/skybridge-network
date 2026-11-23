namespace SkyBridge.Domain.Airports;

public sealed record RunwayData(
    int SourceId,
    string? LowEndIdent,
    string? HighEndIdent,
    int? LengthFt,
    int? WidthFt,
    string? Surface,
    RunwaySurface SurfaceType,
    bool Lighted,
    double? HeadingDegT);