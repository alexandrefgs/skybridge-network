using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class FlightRouteRepository : Repository<FlightRoute>, IFlightRouteRepository
{
    public FlightRouteRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<FlightRoute>> GetByAirlineAsync(int airlineId) =>
        await DbSet.Where(r => r.AirlineId == airlineId).ToListAsync();
}

public class AircraftRepository : Repository<Aircraft>, IAircraftRepository
{
    public AircraftRepository(AppDbContext db) : base(db) { }
}