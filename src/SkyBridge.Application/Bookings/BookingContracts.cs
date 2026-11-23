using System.ComponentModel.DataAnnotations;
using SkyBridge.Application.Freelance;

namespace SkyBridge.Application.Bookings;

public sealed record BookingResponse(
    int Id,
    string Status,
    string Source,
    string Aircraft,
    int CurrentLeg,
    int LegCount,
    bool LegInProgress,
    DateTime BookedAtUtc,
    DateTime StartDeadlineUtc,
    DateTime? StartedAtUtc,
    DateTime? LegStartedAtUtc,
    FreelanceJobResponse? Job);

public sealed record AcceptJobRequest([Required, MaxLength(4)] string Aircraft);