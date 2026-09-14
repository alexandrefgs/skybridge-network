using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Enums;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class PilotCareerRepository : Repository<PilotCareer>, IPilotCareerRepository
{
    public PilotCareerRepository(AppDbContext db) : base(db) { }

    public async Task<PilotCareer?> GetByPilotAndAirlineAsync(int pilotId, int airlineId) =>
        await DbSet
            .Include(c => c.RankAtual)
            .FirstOrDefaultAsync(c => c.PilotId == pilotId && c.AirlineId == airlineId);
}

public class PirepRepository : Repository<Pirep>, IPirepRepository
{
    public PirepRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<Pirep>> GetPendentesAsync() =>
        await DbSet
            .Where(p => p.Status == PirepStatus.PendenteAprovacao)
            .Include(p => p.Pilot)
            .Include(p => p.FlightRoute)
            .ToListAsync();

    public async Task<IReadOnlyList<Pirep>> GetUltimosAsync(int quantidade, int? pilotoId = null)
    {
        var query = DbSet
            .Include(p => p.Pilot)
            .Include(p => p.FlightRoute).ThenInclude(f => f!.Airline)
            .Include(p => p.Aircraft)
            .AsQueryable();

        if (pilotoId is not null)
            query = query.Where(p => p.PilotId == pilotoId);

        return await query
            .OrderByDescending(p => p.DataVoo)
            .Take(quantidade)
            .ToListAsync();
    }

    public async Task<Pirep?> GetComDetalhesAsync(int id) =>
        await DbSet
            .Include(p => p.Pilot)
            .Include(p => p.FlightRoute).ThenInclude(f => f!.Airline)
            .Include(p => p.Aircraft)
            .FirstOrDefaultAsync(p => p.Id == id);
}