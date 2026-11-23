using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Common;
using SkyBridge.Application.Pilots;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Pilots;
using SkyBridge.Infrastructure.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Pilots;

internal sealed class PilotService(SkyBridgeDbContext db, IBookingService bookings) : IPilotService
{
    public async Task<PilotResponse> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        var pilot = await db.Pilots.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        return await ToResponseAsync(pilot, cancellationToken);
    }

    public async Task<Result<PilotResponse>> JumpseatAsync(Guid userId, JumpseatRequest request, CancellationToken cancellationToken)
    {
        var airports = await AirportCodes.FindAsync(db, [request.Airport], cancellationToken);
        if (await bookings.HasActiveAsync(userId, cancellationToken))
            return Result<PilotResponse>.Conflict(nameof(request.Airport), "You can't take a jumpseat during an active flight. Cancel it first.");
        if (!airports.TryGetValue(AirportCodes.Normalize(request.Airport), out var airport))
            return Result<PilotResponse>.Invalid(nameof(request.Airport), $"Airport '{AirportCodes.Normalize(request.Airport)}' was not found.");

        var pilot = await db.Pilots.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (pilot is null)
        {
            pilot = Pilot.Create(userId);
            db.Pilots.Add(pilot);
        }

        pilot.MoveTo(airport.Id);
        await db.SaveChangesAsync(cancellationToken);

        return Result<PilotResponse>.Ok(new PilotResponse(ToLocation(airport), pilot.FlightHours));
    }

    private async Task<PilotResponse> ToResponseAsync(Pilot? pilot, CancellationToken cancellationToken)
    {
        if (pilot?.CurrentAirportId is not { } airportId)
            return new PilotResponse(null, pilot?.FlightHours ?? 0);

        var airport = await db.Airports.AsNoTracking().FirstAsync(a => a.Id == airportId, cancellationToken);
        return new PilotResponse(ToLocation(airport), pilot.FlightHours);
    }

    private static PilotLocation ToLocation(Airport airport) =>
        new(AirportCodes.Display(airport), airport.IataCode, airport.Name, airport.Municipality, airport.CountryCode,
            airport.Latitude, airport.Longitude);
}