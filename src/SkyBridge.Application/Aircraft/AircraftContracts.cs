using System.ComponentModel.DataAnnotations;
using SkyBridge.Domain.Aircraft;

namespace SkyBridge.Application.Aircraft;

public sealed record AircraftCategoryResponse(string Code, string Name, int RequiredHours, int PayPerHour)
{
    public static AircraftCategoryResponse From(AircraftCategory category) =>
        new(category.Code.ToString(), category.Name, category.RequiredHours, category.PayPerHour);
}

public sealed record UpdateAircraftCategoryRequest(
    [Required, MaxLength(50)] string Name,
    [Range(0, 100_000)] int RequiredHours,
    [Range(0, 100_000)] int PayPerHour);

public sealed record AircraftTypeResponse(
    string IcaoCode,
    string Manufacturer,
    string Model,
    string Category,
    string EngineType,
    int EngineCount,
    int RangeNm,
    int CruiseSpeedKts,
    int ServiceCeilingFt,
    int Seats,
    int MaxCargoKg,
    int MinRunwayFt,
    bool RequiresPavedRunway,
    string? Family)
{
    public static AircraftTypeResponse From(AircraftType type) =>
        new(type.IcaoCode, type.Manufacturer, type.Model, type.Category.ToString(), type.EngineType.ToString(),
            type.EngineCount, type.RangeNm, type.CruiseSpeedKts, type.ServiceCeilingFt, type.Seats, type.MaxCargoKg,
            type.MinRunwayFt, type.RequiresPavedRunway, type.Family);
}

public sealed record AircraftTypeSearch(AircraftCategoryCode? Category, string? Query, int Page = 1, int PageSize = 20);

public sealed record AircraftTypeRequest(
    [Required, RegularExpression("^[A-Za-z0-9]{2,4}$")] string IcaoCode,
    [Required, MaxLength(60)] string Manufacturer,
    [Required, MaxLength(60)] string Model,
    [EnumDataType(typeof(AircraftCategoryCode))] AircraftCategoryCode Category,
    [EnumDataType(typeof(EngineType))] EngineType EngineType,
    [Range(1, 8)] int EngineCount,
    [Range(1, 20_000)] int RangeNm,
    [Range(1, 1_000)] int CruiseSpeedKts,
    [Range(1, 60_000)] int ServiceCeilingFt,
    [Range(1, 1_000)] int Seats,
    [Range(0, 200_000)] int MaxCargoKg,
    [Range(500, 15_000)] int MinRunwayFt,
    bool RequiresPavedRunway,
    [MaxLength(AircraftType.MaxFamilyLength)] string? Family = null)
{
    public AircraftTypeData ToData() =>
        new(IcaoCode, Manufacturer, Model, Category, EngineType, EngineCount, RangeNm, CruiseSpeedKts, ServiceCeilingFt, Seats, MaxCargoKg,
            MinRunwayFt, RequiresPavedRunway, Family);
}