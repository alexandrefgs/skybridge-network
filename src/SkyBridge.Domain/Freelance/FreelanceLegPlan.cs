using SkyBridge.Domain.Airports;

namespace SkyBridge.Domain.Freelance;

public sealed record FreelanceLegPlan(
    Airport Origin,
    Airport Destination,
    int PassengerCount,
    IReadOnlyList<string> PassengerNames,
    int CargoKg,
    IReadOnlyList<DangerousGood> DangerousGoods);