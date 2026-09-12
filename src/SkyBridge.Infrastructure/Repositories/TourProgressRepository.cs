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
            .Include(tp => tp.Tour)
            .Where(tp => tp.PilotId == pilotId)
            .ToListAsync();

    public async Task<TourProgress?> GetByPilotAndTourAsync(int pilotId, int tourId) =>
        await DbSet.FirstOrDefaultAsync(tp => tp.PilotId == pilotId && tp.TourId == tourId);

    // Busca todo progresso em andamento cujo tour tenha, na próxima etapa não concluída,
    // exatamente a rota informada. Usado ao aprovar um PIREP, pra saber quais tours avançar.
    public async Task<IReadOnlyList<TourProgress>> GetEmAndamentoPorRotaAsync(int flightRouteId) =>
        await DbSet
            .Include(tp => tp.Tour).ThenInclude(t => t!.Etapas)
            .Where(tp => !tp.Concluido
                && tp.Tour!.Etapas.Any(e => e.Ordem == tp.EtapasCompletas + 1 && e.FlightRouteId == flightRouteId))
            .ToListAsync();
}