namespace SkyBridge.Domain.Aircraft;

public sealed record AircraftTypeData(
    string IcaoCode,
    string Manufacturer,
    string Model,
    AircraftCategoryCode Category,
    EngineType EngineType,
    int EngineCount,
    int RangeNm,
    int CruiseSpeedKts,
    int ServiceCeilingFt,
    int Seats,
    int MaxCargoKg);