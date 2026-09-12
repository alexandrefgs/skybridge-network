using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class PilotRepository : Repository<Pilot>, IPilotRepository
{
    private const string PrefixoCallsign = "SKB";
    private const int NumeroInicial = 1001;

    public PilotRepository(AppDbContext db) : base(db) { }

    public async Task<Pilot?> GetWithCareerDetailsAsync(int id) =>
        await DbSet
            .Include(p => p.Carreiras).ThenInclude(c => c.Airline)
            .Include(p => p.Carreiras).ThenInclude(c => c.RankAtual)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Pilot?> GetByEmailAsync(string email) =>
        await DbSet.FirstOrDefaultAsync(p => p.Email == email);

    // Reaproveita números liberados (ex: piloto que saiu da VA) em vez de sempre
    // incrementar o maior número já usado.
    public async Task<int> GetProximoNumeroCallsignAsync()
    {
        var numerosUsados = (await DbSet.Select(p => p.Callsign).ToListAsync())
            .Where(c => c.Length == PrefixoCallsign.Length + 4 && c.StartsWith(PrefixoCallsign))
            .Select(c => int.TryParse(c[PrefixoCallsign.Length..], out var n) ? n : (int?)null)
            .Where(n => n.HasValue)
            .Select(n => n!.Value)
            .ToHashSet();

        var proximo = NumeroInicial;
        while (numerosUsados.Contains(proximo))
            proximo++;

        return proximo;
    }
}