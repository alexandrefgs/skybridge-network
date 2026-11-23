using System.ComponentModel.DataAnnotations;
using SkyBridge.Domain.Freelance;

namespace SkyBridge.Application.Freelance;

public sealed record DangerousGoodResponse(string Name, string Class, int QuantityKg, string? UnNumber);

public sealed record FreelanceLegResponse(
    int Sequence,
    string Origin,
    string? OriginIata,
    string OriginName,
    string Destination,
    string? DestinationIata,
    string DestinationName,
    int DistanceNm,
    int PassengerCount,
    IReadOnlyList<string> PassengerNames,
    int CargoKg,
    IReadOnlyList<DangerousGoodResponse> DangerousGoods);

public sealed record FreelanceJobResponse(
    int Id,
    string Kind,
    string Origin,
    string? OriginIata,
    string OriginName,
    string Destination,
    string? DestinationIata,
    string DestinationName,
    int DistanceNm,
    string? Client,
    string? Briefing,
    IReadOnlyList<FreelanceLegResponse> Legs,
    int Reward,
    DateTime ExpiresAtUtc,
    bool Expired,
    IReadOnlyList<string> Aircraft,
    IReadOnlyList<string> Warnings);

public sealed record FreelanceJobSearch(string? From, bool IncludeExpired = false, int Page = 1, int PageSize = 20);

public sealed record DangerousGoodRequest(
    [Required, MaxLength(DangerousGood.MaxNameLength)] string Name,
    [EnumDataType(typeof(DangerousGoodClass))] DangerousGoodClass Class,
    [Range(0, 1_000_000)] int QuantityKg,
    [MaxLength(8)] string? UnNumber = null);

public sealed record FreelanceLegRequest(
    [Required, MaxLength(16)] string Origin,
    [Required, MaxLength(16)] string Destination,
    [Range(0, 1_000)] int PassengerCount,
    [Range(0, 1_000_000)] int CargoKg,
    IReadOnlyList<string>? PassengerNames = null,
    IReadOnlyList<DangerousGoodRequest>? DangerousGoods = null);

public sealed record FreelanceJobRequest(
    [EnumDataType(typeof(FreelanceJobKind))] FreelanceJobKind Kind,
    [Range(0, 10_000_000)] int Reward,
    DateTime ExpiresAtUtc,
    IReadOnlyList<string>? Aircraft,
    IReadOnlyList<FreelanceLegRequest>? Legs,
    [MaxLength(FreelanceJob.MaxClientLength)] string? Client = null,
    [MaxLength(FreelanceJob.MaxBriefingLength)] string? Briefing = null);