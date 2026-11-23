using System.ComponentModel.DataAnnotations;

namespace SkyBridge.Application.Pilots;

public sealed record PilotLocation(
    string Code,
    string? IataCode,
    string Name,
    string? Municipality,
    string CountryCode,
    double Latitude,
    double Longitude);

public sealed record PilotResponse(PilotLocation? Location, decimal FlightHours, int FlightMinutes, int Balance);

public sealed record PilotTransactionResponse(int Id, int Amount, string Description, DateTime CreatedAtUtc);

public sealed record JumpseatRequest([Required, MaxLength(16)] string Airport);