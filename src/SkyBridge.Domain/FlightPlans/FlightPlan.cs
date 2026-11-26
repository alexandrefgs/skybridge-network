using System.Text.Json;

namespace SkyBridge.Domain.FlightPlans;

public sealed class FlightPlan
{
    public const int MaxRouteLength = 2000;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private FlightPlan() { }

    public int Id { get; private set; }
    public int BookingId { get; private set; }
    public int LegSequence { get; private set; }
    public string SimBriefId { get; private set; } = string.Empty;
    public DateTime GeneratedAtUtc { get; private set; }
    public DateTime ImportedAtUtc { get; private set; }
    public string? Airac { get; private set; }
    public string Origin { get; private set; } = string.Empty;
    public string Destination { get; private set; } = string.Empty;
    public string? Alternate { get; private set; }
    public string Aircraft { get; private set; } = string.Empty;
    public string? Registration { get; private set; }
    public string? Callsign { get; private set; }
    public string Route { get; private set; } = string.Empty;
    public int CruiseAltitudeFt { get; private set; }
    public int DistanceNm { get; private set; }
    public int EnrouteMinutes { get; private set; }
    public int BlockFuelKg { get; private set; }
    public int TakeoffFuelKg { get; private set; }
    public int LandingFuelKg { get; private set; }
    public int TripFuelKg { get; private set; }
    public int PassengerCount { get; private set; }
    public int CargoKg { get; private set; }
    public int ZeroFuelWeightKg { get; private set; }
    public int TakeoffWeightKg { get; private set; }
    public int LandingWeightKg { get; private set; }
    public string? DetailsJson { get; private set; }

    public static FlightPlan Create(int bookingId, int legSequence, FlightPlanData data, DateTime nowUtc)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(legSequence, 1);
        var plan = new FlightPlan { BookingId = bookingId, LegSequence = legSequence };
        plan.Replace(data, nowUtc);
        return plan;
    }

    public void Replace(FlightPlanData data, DateTime nowUtc)
    {
        ArgumentNullException.ThrowIfNull(data);
        ArgumentException.ThrowIfNullOrWhiteSpace(data.SimBriefId);
        ArgumentException.ThrowIfNullOrWhiteSpace(data.Origin);
        ArgumentException.ThrowIfNullOrWhiteSpace(data.Destination);
        ArgumentException.ThrowIfNullOrWhiteSpace(data.Aircraft);

        SimBriefId = data.SimBriefId.Trim();
        GeneratedAtUtc = data.GeneratedAtUtc;
        ImportedAtUtc = nowUtc;
        Airac = Clean(data.Airac);
        Origin = Code(data.Origin);
        Destination = Code(data.Destination);
        Alternate = data.Alternate is null ? null : Code(data.Alternate);
        Aircraft = Code(data.Aircraft);
        Registration = Clean(data.Registration);
        Callsign = Clean(data.Callsign);
        var route = data.Route.Trim();
        Route = route.Length > MaxRouteLength ? route[..MaxRouteLength] : route;
        CruiseAltitudeFt = Math.Max(0, data.CruiseAltitudeFt);
        DistanceNm = Math.Max(0, data.DistanceNm);
        EnrouteMinutes = Math.Max(0, data.EnrouteMinutes);
        BlockFuelKg = Math.Max(0, data.BlockFuelKg);
        TakeoffFuelKg = Math.Max(0, data.TakeoffFuelKg);
        LandingFuelKg = Math.Max(0, data.LandingFuelKg);
        TripFuelKg = Math.Max(0, data.TripFuelKg);
        PassengerCount = Math.Max(0, data.PassengerCount);
        CargoKg = Math.Max(0, data.CargoKg);
        ZeroFuelWeightKg = Math.Max(0, data.ZeroFuelWeightKg);
        TakeoffWeightKg = Math.Max(0, data.TakeoffWeightKg);
        LandingWeightKg = Math.Max(0, data.LandingWeightKg);
        DetailsJson = data.Details is null ? null : JsonSerializer.Serialize(data.Details, Json);
    }

    public FlightPlanDetails? ReadDetails() =>
        DetailsJson is null ? null : JsonSerializer.Deserialize<FlightPlanDetails>(DetailsJson, Json);

    public static IReadOnlyList<string> Problems(FlightPlanData data, string origin, string destination, string aircraft, DateTime bookedAtUtc)
    {
        var problems = new List<string>();
        if (!Same(data.Origin, origin))
            problems.Add($"The OFP departs from {Code(data.Origin)}, but this leg departs from {Code(origin)}.");
        if (!Same(data.Destination, destination))
            problems.Add($"The OFP arrives at {Code(data.Destination)}, but this leg arrives at {Code(destination)}.");
        if (!Same(data.Aircraft, aircraft))
            problems.Add($"The OFP is for a {Code(data.Aircraft)}, but you booked a {Code(aircraft)}.");
        if (data.GeneratedAtUtc < bookedAtUtc)
            problems.Add("This OFP was generated before you booked the flight. Generate a new one on SimBrief.");
        return problems;
    }

    private static bool Same(string a, string b) => string.Equals(a.Trim(), b.Trim(), StringComparison.OrdinalIgnoreCase);

    private static string Code(string value) => value.Trim().ToUpperInvariant();

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}