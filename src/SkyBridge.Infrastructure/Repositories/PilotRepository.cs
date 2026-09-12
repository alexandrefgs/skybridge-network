using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class PilotRepository : Repository<Pilot>, IPilotRepository
{
    public PilotRepository(AppDbContext db) : base(db) { }

    public async Task<Pilot?> GetWithCareerDetailsAsync(int id) =>
        await DbSet
            .Include(p => p.Carreiras).ThenInclude(c => c.Airline)
            .Include(p => p.Carreiras).ThenInclude(c => c.RankAtual)
            .FirstOrDefaultAsync(p => p.Id == id);
}