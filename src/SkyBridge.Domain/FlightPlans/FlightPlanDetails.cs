namespace SkyBridge.Domain.FlightPlans;

public sealed record FlightPlanDetails(
    FlightPlanAirport Departure,
    FlightPlanAirport Arrival,
    FlightPlanAlternate? Alternate,
    FlightPlanFuel Fuel,
    FlightPlanPerformance Performance,
    string? AtcFlightPlan,
    IReadOnlyList<NavlogFix> Navlog);

public sealed record FlightPlanAirport(
    string Code,
    string? Name,
    string? Runway,
    int ElevationFt,
    int TransitionAltitudeFt,
    int TransitionLevelFt,
    string? Metar,
    string? Taf);

public sealed record FlightPlanAlternate(
    string Code,
    string? Name,
    string? Runway,
    int DistanceNm,
    int CruiseAltitudeFt,
    int BurnKg,
    int EnrouteMinutes,
    string? Route,
    string? Metar);

public sealed record FlightPlanFuel(
    int TaxiKg,
    int TripKg,
    int ContingencyKg,
    int AlternateKg,
    int ReserveKg,
    int ExtraKg,
    int MinTakeoffKg,
    int TakeoffKg,
    int BlockKg,
    int LandingKg,
    int AverageFlowKgPerHour);

public sealed record FlightPlanPerformance(
    string? CostIndex,
    string? Sid,
    string? Star,
    string? StepClimbs,
    int AverageWindDirection,
    int AverageWindSpeedKts,
    int AverageWindComponentKts,
    int AverageTempDeviation,
    int CruiseTasKts,
    string? CruiseMach,
    string? ClimbProfile,
    string? CruiseProfile,
    string? DescentProfile);

public sealed record NavlogFix(
    string Ident,
    string? Name,
    string Type,
    string? Airway,
    string? Stage,
    bool SidStar,
    int AltitudeFt,
    int DistanceNm,
    int TrackMag,
    int WindDirection,
    int WindSpeedKts,
    int OatC,
    int GroundSpeedKts,
    int ElapsedMinutes,
    int FuelUsedKg,
    int FuelOnboardKg,
    double Latitude,
    double Longitude);