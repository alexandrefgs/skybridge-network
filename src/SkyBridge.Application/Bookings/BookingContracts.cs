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
    FreelanceJobResponse? Job,
    string? FlightNumber,
    int PayPerHour,
    AirlineFlightResponse? Flight);

public sealed record AirlineFlightResponse(
    int? RouteId,
    string FlightNumber,
    string Airline,
    string Origin,
    string OriginName,
    string Destination,
    string DestinationName,
    int DistanceNm,
    string? AtsRoute,
    int? FlightLevel);

public sealed record AcceptJobRequest([Required, MaxLength(4)] string Aircraft);