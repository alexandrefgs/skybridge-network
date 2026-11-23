using SkyBridge.Domain.Airports;

namespace SkyBridge.Domain.Freelance;

public sealed class FreelanceJob
{
    public const int MaxClientLength = 100;
    public const int MaxBriefingLength = 4000;
    public const int MaxLegs = 8;

    private readonly List<FreelanceJobAircraft> _aircraft = [];
    private readonly List<FreelanceJobLeg> _legs = [];

    private FreelanceJob() { }

    public int Id { get; private set; }
    public FreelanceJobKind Kind { get; private set; }
    public int OriginAirportId { get; private set; }
    public int DestinationAirportId { get; private set; }
    public int DistanceNm { get; private set; }
    public string? Client { get; private set; }
    public string? Briefing { get; private set; }
    public int Reward { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public IReadOnlyCollection<FreelanceJobAircraft> Aircraft => _aircraft;
    public IReadOnlyList<FreelanceJobLeg> Legs => _legs;

    public static FreelanceJob Create(FreelanceJobDetails details, IReadOnlyList<FreelanceLegPlan> legs,
        IReadOnlyCollection<int> aircraftTypeIds, DateTime nowUtc)
    {
        var job = new FreelanceJob { CreatedAtUtc = nowUtc };
        job.Update(details, legs, aircraftTypeIds, nowUtc);
        return job;
    }

    public void Update(FreelanceJobDetails details, IReadOnlyList<FreelanceLegPlan> legs,
        IReadOnlyCollection<int> aircraftTypeIds, DateTime nowUtc)
    {
        if (!Enum.IsDefined(details.Kind))
            throw new ArgumentOutOfRangeException(nameof(details), "Unknown mission type.");
        ArgumentOutOfRangeException.ThrowIfNegative(details.Reward);
        if (details.ExpiresAtUtc <= nowUtc)
            throw new ArgumentException("The job must expire in the future.", nameof(details));
        if (aircraftTypeIds.Count == 0)
            throw new ArgumentException("The job needs at least one aircraft type.", nameof(aircraftTypeIds));
        if (legs.Count is 0 or > MaxLegs)
            throw new ArgumentException($"A job needs between 1 and {MaxLegs} legs.", nameof(legs));

        for (var i = 0; i < legs.Count; i++)
        {
            var leg = legs[i];
            if (details.Kind != FreelanceJobKind.Skydiving && SameAirport(leg.Origin, leg.Destination))
                throw new ArgumentException($"Leg {i + 1} must go to a different airport.", nameof(legs));
            if (i > 0 && !SameAirport(legs[i - 1].Destination, leg.Origin))
                throw new ArgumentException($"Leg {i + 1} must depart from where leg {i} lands.", nameof(legs));
        }

        var newLegs = legs.Select((plan, index) => FreelanceJobLeg.Create(index + 1, plan)).ToList();

        Kind = details.Kind;
        Client = Clean(details.Client, MaxClientLength, "Client");
        Briefing = Clean(details.Briefing, MaxBriefingLength, "Briefing");
        Reward = details.Reward;
        ExpiresAtUtc = details.ExpiresAtUtc;
        OriginAirportId = legs[0].Origin.Id;
        DestinationAirportId = legs[^1].Destination.Id;
        DistanceNm = newLegs.Sum(l => l.DistanceNm);

        _legs.Clear();
        _legs.AddRange(newLegs);

        var wanted = aircraftTypeIds.ToHashSet();
        _aircraft.RemoveAll(entry => !wanted.Contains(entry.AircraftTypeId));
        foreach (var id in wanted.Where(id => _aircraft.All(entry => entry.AircraftTypeId != id)))
            _aircraft.Add(new FreelanceJobAircraft(id));
    }

    public bool IsExpired(DateTime nowUtc) => nowUtc >= ExpiresAtUtc;

    private static bool SameAirport(Airport a, Airport b) =>
        string.Equals(a.Ident, b.Ident, StringComparison.OrdinalIgnoreCase);

    private static string? Clean(string? value, int maxLength, string field)
    {
        var clean = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        if (clean is { Length: var length } && length > maxLength)
            throw new ArgumentException($"{field} must have at most {maxLength} characters.", field);
        return clean;
    }
}