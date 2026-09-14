using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class TourRepository : Repository<Tour>, ITourRepository
{
    public TourRepository(AppDbContext db) : base(db) { }

    public async Task<Tour?> GetWithEtapasAsync(int id) =>
        await DbSet
            .Include(t => t.Etapas.OrderBy(e => e.Ordem))
            .ThenInclude(e => e.FlightRoute)
            .ThenInclude(r => r!.Airline)
            .Include(t => t.Award)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<IReadOnlyList<Tour>> GetAllWithDetailsAsync() =>
        await DbSet
            .Include(t => t.Etapas.OrderBy(e => e.Ordem))
            .ThenInclude(e => e.FlightRoute)
            .ThenInclude(r => r!.Airline)
            .Include(t => t.Award)
            .ToListAsync();
}