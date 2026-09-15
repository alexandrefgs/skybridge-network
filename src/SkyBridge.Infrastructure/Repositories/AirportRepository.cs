using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class AirportRepository : Repository<Airport>, IAirportRepository
{
    public AirportRepository(AppDbContext db) : base(db) { }

    public async Task<Airport?> GetByIcaoAsync(string icao) =>
        await DbSet.FirstOrDefaultAsync(a => a.Icao == icao);
}