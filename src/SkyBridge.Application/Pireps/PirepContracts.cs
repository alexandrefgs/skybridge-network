using System.ComponentModel.DataAnnotations;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Pilots;

namespace SkyBridge.Application.Pireps;

public sealed record FilePirepRequest(
    DateTime DepartedAtUtc,
    DateTime ArrivedAtUtc,
    [Range(0, 1_000_000)] int? FuelUsedKg,
    [Range(0, 5_000)] int? LandingRateFpm,
    [MaxLength(500)] string? Remarks);

public sealed record ReviewPirepRequest([MaxLength(300)] string? Note);

public sealed record PirepResponse(
    int Id,
    int BookingId,
    string Pilot,
    int Leg,
    int LegCount,
    string Origin,
    string Destination,
    string Aircraft,
    int DistanceNm,
    DateTime DepartedAtUtc,
    DateTime ArrivedAtUtc,
    int FlightMinutes,
    int? FuelUsedKg,
    int? LandingRateFpm,
    string? Remarks,
    string Status,
    string? Flag,
    string? ReviewNote,
    DateTime FiledAtUtc,
    DateTime? ReviewedAtUtc);

public sealed record PirepFiledResponse(PirepResponse Pirep, BookingResponse? Booking, int? RewardPaid, PilotResponse Pilot);

public sealed record PirepSearch(string? Status, int Page = 1, int PageSize = 20);