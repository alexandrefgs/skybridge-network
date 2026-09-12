using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class TourProgressRepository : Repository<TourProgress>, ITourProgressRepository
{
    public TourProgressRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<TourProgress>> GetByPilotAsync(int pilotId) =>
        await DbSet
            .Include(tp => tp.Tour).ThenInclude(t => t!.Etapas)
            .Where(tp => tp.PilotId == pilotId)
            .ToListAsync();

    public async Task<TourProgress?> GetByPilotAndTourAsync(int pilotId, int tourId) =>
        await DbSet.FirstOrDefaultAsync(tp => tp.PilotId == pilotId && tp.TourId == tourId);

    public async Task<IReadOnlyList<TourProgress>> GetEmAndamentoPorPilotoERotaAsync(int pilotId, int flightRouteId) =>
        await DbSet
            .Include(tp => tp.Tour).ThenInclude(t => t!.Etapas)
            .Where(tp => tp.PilotId == pilotId
                        && !tp.Concluido
                        && tp.Tour!.Etapas.Any(e => e.Ordem == tp.EtapasCompletas + 1 && e.FlightRouteId == flightRouteId))
            .ToListAsync();
}