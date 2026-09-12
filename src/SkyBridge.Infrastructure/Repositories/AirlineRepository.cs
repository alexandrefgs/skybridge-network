using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class AirlineRepository : Repository<Airline>, IAirlineRepository
{
    public AirlineRepository(AppDbContext db) : base(db) { }

    public async Task<Airline?> GetWithDetailsAsync(int id) =>
        await DbSet
            .Include(a => a.Frota)
            .Include(a => a.Rotas)
            .Include(a => a.Ranks)
            .FirstOrDefaultAsync(a => a.Id == id);
}