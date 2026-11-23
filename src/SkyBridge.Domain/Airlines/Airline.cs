using System.Text.RegularExpressions;

namespace SkyBridge.Domain.Airlines;

public sealed partial class Airline
{
    private readonly List<AirlineAircraft> _fleet = [];

    private Airline() { }

    public int Id { get; private set; }
    public int? SourceId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? IataCode { get; private set; }
    public string? IcaoCode { get; private set; }
    public string? Callsign { get; private set; }
    public string? Country { get; private set; }
    public bool IsActive { get; private set; }
    public IReadOnlyCollection<AirlineAircraft> Fleet => _fleet;

    public static Airline Create(AirlineData data, int? sourceId = null)
    {
        var airline = new Airline { SourceId = sourceId };
        airline.Apply(data);
        return airline;
    }

    public bool Apply(AirlineData data)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(data.Name);

        var iata = Optional(data.IataCode)?.ToUpperInvariant();
        if (iata is not null && !IataPattern().IsMatch(iata))
            throw new ArgumentException("IATA code must have 2 letters or digits.", nameof(data));

        var icao = Optional(data.IcaoCode)?.ToUpperInvariant();
        if (icao is not null && !IcaoPattern().IsMatch(icao))
            throw new ArgumentException("ICAO code must have 3 letters.", nameof(data));

        var normalized = new AirlineData(data.Name.Trim(), iata, icao, Optional(data.Callsign)?.ToUpperInvariant(), Optional(data.Country), data.IsActive);
        if (ToData() == normalized)
            return false;

        Name = normalized.Name;
        IataCode = normalized.IataCode;
        IcaoCode = normalized.IcaoCode;
        Callsign = normalized.Callsign;
        Country = normalized.Country;
        IsActive = normalized.IsActive;
        return true;
    }

    public void SetFleet(IEnumerable<int> aircraftTypeIds)
    {
        var wanted = aircraftTypeIds.ToHashSet();
        _fleet.RemoveAll(entry => !wanted.Contains(entry.AircraftTypeId));
        foreach (var id in wanted.Where(id => _fleet.All(entry => entry.AircraftTypeId != id)))
            _fleet.Add(new AirlineAircraft(id));
    }

    public AirlineData ToData() => new(Name, IataCode, IcaoCode, Callsign, Country, IsActive);

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex("^[A-Z0-9]{2}$")]
    private static partial Regex IataPattern();

    [GeneratedRegex("^[A-Z]{3}$")]
    private static partial Regex IcaoPattern();
}