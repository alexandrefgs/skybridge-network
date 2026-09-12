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
}