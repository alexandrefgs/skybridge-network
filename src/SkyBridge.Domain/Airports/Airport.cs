namespace SkyBridge.Domain.Airports;

public sealed class Airport
{
    private readonly List<Runway> _runways = [];

    private Airport() { }

    public int Id { get; private set; }
    public string Ident { get; private set; } = string.Empty;
    public string? IcaoCode { get; private set; }
    public string? IataCode { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public AirportType Type { get; private set; }
    public double Latitude { get; private set; }
    public double Longitude { get; private set; }
    public int? ElevationFt { get; private set; }
    public string CountryCode { get; private set; } = string.Empty;
    public string RegionCode { get; private set; } = string.Empty;
    public string? Municipality { get; private set; }
    public bool ScheduledService { get; private set; }
    public int? LongestRunwayFt { get; private set; }
    public int? LongestHardRunwayFt { get; private set; }
    public IReadOnlyList<Runway> Runways => _runways;

    public static Airport Create(AirportData data)
    {
        var airport = new Airport();
        airport.Apply(data);
        return airport;
    }

    public bool Apply(AirportData data)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(data.Ident);
        ArgumentException.ThrowIfNullOrWhiteSpace(data.Name);

        if (ToData() == data)
            return false;

        Ident = data.Ident;
        IcaoCode = data.IcaoCode;
        IataCode = data.IataCode;
        Name = data.Name;
        Type = data.Type;
        Latitude = data.Latitude;
        Longitude = data.Longitude;
        ElevationFt = data.ElevationFt;
        CountryCode = data.CountryCode;
        RegionCode = data.RegionCode;
        Municipality = data.Municipality;
        ScheduledService = data.ScheduledService;
        return true;
    }

    public AirportData ToData() =>
        new(Ident, IcaoCode, IataCode, Name, Type, Latitude, Longitude, ElevationFt, CountryCode, RegionCode, Municipality, ScheduledService);

    public RunwaySyncResult SyncRunways(IEnumerable<RunwayData> runways)
    {
        var current = _runways.ToDictionary(r => r.SourceId);
        int added = 0, updated = 0;

        foreach (var data in runways.Where(r => r.SurfaceType != RunwaySurface.Water).DistinctBy(r => r.SourceId))
        {
            if (current.Remove(data.SourceId, out var runway))
            {
                if (runway.Apply(data))
                    updated++;
            }
            else
            {
                _runways.Add(Runway.Create(data));
                added++;
            }
        }

        foreach (var stale in current.Values)
            _runways.Remove(stale);

        LongestRunwayFt = _runways.Max(r => r.LengthFt);
        LongestHardRunwayFt = _runways.Where(r => r.IsHardSurface).Max(r => r.LengthFt);
        return new RunwaySyncResult(added, updated, current.Count);
    }
}

public sealed record RunwaySyncResult(int Added, int Updated, int Removed)
{
    public bool Changed => Added + Updated + Removed > 0;
}