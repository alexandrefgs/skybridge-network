namespace SkyBridge.Domain.Airports;

public sealed class Runway
{
    private Runway() { }

    public int Id { get; private set; }
    public int AirportId { get; private set; }
    public int SourceId { get; private set; }
    public string? LowEndIdent { get; private set; }
    public string? HighEndIdent { get; private set; }
    public int? LengthFt { get; private set; }
    public int? WidthFt { get; private set; }
    public string? Surface { get; private set; }
    public RunwaySurface SurfaceType { get; private set; }
    public bool Lighted { get; private set; }
    public double? HeadingDegT { get; private set; }

    public bool IsHardSurface => SurfaceType is RunwaySurface.Paved or RunwaySurface.Unknown;

    internal static Runway Create(RunwayData data)
    {
        var runway = new Runway { SourceId = data.SourceId };
        runway.Apply(data);
        return runway;
    }

    internal bool Apply(RunwayData data)
    {
        if (ToData() == data)
            return false;

        LowEndIdent = data.LowEndIdent;
        HighEndIdent = data.HighEndIdent;
        LengthFt = data.LengthFt;
        WidthFt = data.WidthFt;
        Surface = data.Surface;
        SurfaceType = data.SurfaceType;
        Lighted = data.Lighted;
        HeadingDegT = data.HeadingDegT;
        return true;
    }

    public RunwayData ToData() =>
        new(SourceId, LowEndIdent, HighEndIdent, LengthFt, WidthFt, Surface, SurfaceType, Lighted, HeadingDegT);
}