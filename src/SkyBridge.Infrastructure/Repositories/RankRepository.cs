using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class RankRepository : Repository<Rank>, IRankRepository
{
    public RankRepository(AppDbContext db) : base(db) { }

    public async Task<Rank?> GetRankInicialDaCompanhiaAsync(int airlineId) =>
        await DbSet
            .Where(r => r.AirlineId == airlineId)
            .OrderBy(r => r.Nivel)
            .FirstOrDefaultAsync();

    public async Task<Rank?> GetProximoRankElegivelAsync(int airlineId, int nivelAtual, double horasVoadas, double rating) =>
        await DbSet
            .Where(r => r.AirlineId == airlineId
                        && r.Nivel > nivelAtual
                        && horasVoadas >= r.HorasMinimas
                        && rating >= r.RatingMinimo)
            .OrderByDescending(r => r.Nivel)
            .FirstOrDefaultAsync();
}