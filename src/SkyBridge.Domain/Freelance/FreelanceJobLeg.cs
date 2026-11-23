using SkyBridge.Domain.Geography;

namespace SkyBridge.Domain.Freelance;

public sealed class FreelanceJobLeg
{
    public const int MaxPassengerNameLength = 80;
    public const int MaxNamedPassengers = 50;
    public const int MaxDangerousGoods = 10;

    private FreelanceJobLeg() { }

    public int Id { get; private set; }
    public int FreelanceJobId { get; private set; }
    public int Sequence { get; private set; }
    public int OriginAirportId { get; private set; }
    public int DestinationAirportId { get; private set; }
    public int DistanceNm { get; private set; }
    public int PassengerCount { get; private set; }
    public List<string> PassengerNames { get; private set; } = [];
    public int CargoKg { get; private set; }
    public List<DangerousGood> DangerousGoods { get; private set; } = [];

    internal static FreelanceJobLeg Create(int sequence, FreelanceLegPlan plan)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(plan.PassengerCount);
        ArgumentOutOfRangeException.ThrowIfNegative(plan.CargoKg);

        var names = plan.PassengerNames.Select(n => n?.Trim() ?? string.Empty).Where(n => n.Length > 0).ToList();
        if (names.Any(n => n.Length > MaxPassengerNameLength))
            throw new ArgumentException($"Passenger names must have at most {MaxPassengerNameLength} characters.", nameof(plan));
        if (names.Count > MaxNamedPassengers)
            throw new ArgumentException($"List at most {MaxNamedPassengers} passengers by name on each leg.", nameof(plan));
        if (names.Count > plan.PassengerCount)
            throw new ArgumentException($"Leg {sequence} has more passenger names than passengers.", nameof(plan));
        if (plan.DangerousGoods.Count > MaxDangerousGoods)
            throw new ArgumentException($"List at most {MaxDangerousGoods} dangerous goods on each leg.", nameof(plan));

        return new FreelanceJobLeg
        {
            Sequence = sequence,
            OriginAirportId = plan.Origin.Id,
            DestinationAirportId = plan.Destination.Id,
            DistanceNm = GreatCircle.DistanceNm(plan.Origin.Latitude, plan.Origin.Longitude, plan.Destination.Latitude, plan.Destination.Longitude),
            PassengerCount = plan.PassengerCount,
            PassengerNames = names,
            CargoKg = plan.CargoKg,
            DangerousGoods = plan.DangerousGoods.ToList()
        };
    }
}