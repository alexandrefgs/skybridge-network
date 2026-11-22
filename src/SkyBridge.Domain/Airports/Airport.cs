namespace SkyBridge.Domain.Airports;

public sealed class Airport
{
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
}