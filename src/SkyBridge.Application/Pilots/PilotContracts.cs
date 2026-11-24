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

public sealed record PilotResponse(PilotLocation? Location, decimal FlightHours, int FlightMinutes, int Balance, string? SimBriefPilotId);

public sealed record SimBriefLinkRequest([RegularExpression(@"^\s*\d{0,7}\s*$", ErrorMessage = "The SimBrief Pilot ID has 1 to 7 digits.")] string? PilotId);

public sealed record PilotTransactionResponse(int Id, int Amount, string Description, DateTime CreatedAtUtc);

public sealed record JumpseatRequest([Required, MaxLength(16)] string Airport);