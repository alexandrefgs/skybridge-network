using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class AwardRepository : Repository<Award>, IAwardRepository
{
    public AwardRepository(AppDbContext db) : base(db) { }
}

public class PilotAwardRepository : Repository<PilotAward>, IPilotAwardRepository
{
    public PilotAwardRepository(AppDbContext db) : base(db) { }

    public async Task<bool> PilotJaTemAwardAsync(int pilotId, int awardId) =>
        await DbSet.AnyAsync(pa => pa.PilotId == pilotId && pa.AwardId == awardId);

    public async Task<IReadOnlyList<PilotAward>> GetByPilotAsync(int pilotId) =>
        await DbSet
            .Include(pa => pa.Award)
            .Where(pa => pa.PilotId == pilotId)
            .ToListAsync();
}