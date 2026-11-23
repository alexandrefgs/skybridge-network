namespace SkyBridge.Domain.Pireps;

public sealed record PirepLeg(
    int BookingId,
    Guid PilotUserId,
    int Sequence,
    int OriginAirportId,
    int DestinationAirportId,
    int DistanceNm,
    int AircraftTypeId,
    string AircraftCode,
    int CruiseSpeedKts,
    DateTime LegStartedAtUtc);

public sealed record PirepTimes(
    DateTime DepartedAtUtc,
    DateTime ArrivedAtUtc,
    int? FuelUsedKg,
    int? LandingRateFpm,
    string? Remarks);