using System.Text.RegularExpressions;

namespace SkyBridge.Domain.Aircraft;

public sealed partial class AircraftType
{
    private AircraftType() { }

    public int Id { get; private set; }
    public string IcaoCode { get; private set; } = string.Empty;
    public string Manufacturer { get; private set; } = string.Empty;
    public string Model { get; private set; } = string.Empty;
    public AircraftCategoryCode Category { get; private set; }
    public EngineType EngineType { get; private set; }
    public int EngineCount { get; private set; }
    public int RangeNm { get; private set; }
    public int CruiseSpeedKts { get; private set; }
    public int ServiceCeilingFt { get; private set; }
    public int Seats { get; private set; }
    public int MaxCargoKg { get; private set; }

    public static AircraftType Create(AircraftTypeData data)
    {
        var type = new AircraftType();
        type.Update(data);
        return type;
    }

    public void Update(AircraftTypeData data)
    {
        var icao = data.IcaoCode?.Trim().ToUpperInvariant() ?? string.Empty;
        if (!IcaoPattern().IsMatch(icao))
            throw new ArgumentException("ICAO code must have 2 to 4 letters or digits.", nameof(data));

        ArgumentException.ThrowIfNullOrWhiteSpace(data.Manufacturer);
        ArgumentException.ThrowIfNullOrWhiteSpace(data.Model);
        if (!Enum.IsDefined(data.Category))
            throw new ArgumentOutOfRangeException(nameof(data), "Unknown aircraft category.");
        if (!Enum.IsDefined(data.EngineType))
            throw new ArgumentOutOfRangeException(nameof(data), "Unknown engine type.");
        ArgumentOutOfRangeException.ThrowIfLessThan(data.EngineCount, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(data.RangeNm, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(data.CruiseSpeedKts, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(data.ServiceCeilingFt, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(data.Seats, 1);
        ArgumentOutOfRangeException.ThrowIfNegative(data.MaxCargoKg);

        IcaoCode = icao;
        Manufacturer = data.Manufacturer.Trim();
        Model = data.Model.Trim();
        Category = data.Category;
        EngineType = data.EngineType;
        EngineCount = data.EngineCount;
        RangeNm = data.RangeNm;
        CruiseSpeedKts = data.CruiseSpeedKts;
        ServiceCeilingFt = data.ServiceCeilingFt;
        Seats = data.Seats;
        MaxCargoKg = data.MaxCargoKg;
    }

    public bool CanFly(int distanceNm) => distanceNm <= RangeNm;

    [GeneratedRegex("^[A-Z0-9]{2,4}$")]
    private static partial Regex IcaoPattern();
}