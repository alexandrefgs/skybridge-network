using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Enums;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class BookingRepository : Repository<Booking>, IBookingRepository
{
    public BookingRepository(AppDbContext db) : base(db) { }

    public async Task<Booking?> GetComDetalhesAsync(int id) =>
        await DbSet
            .Include(b => b.Pilot)
            .Include(b => b.FlightRoute)
                .ThenInclude(fr => fr!.Airline)
            .Include(b => b.Aircraft)
            .FirstOrDefaultAsync(b => b.Id == id);

    public async Task<IReadOnlyList<Booking>> GetByPilotAsync(int pilotId) =>
        await DbSet
            .Include(b => b.FlightRoute)
                .ThenInclude(fr => fr!.Airline)
            .Include(b => b.Aircraft)
            .Where(b => b.PilotId == pilotId)
            .OrderByDescending(b => b.CriadoEmUtc)
            .ToListAsync();

    public async Task<Booking?> GetEmVooPorPilotoAsync(int pilotId) =>
        await DbSet.FirstOrDefaultAsync(b => b.PilotId == pilotId && b.Status == BookingStatus.EmVoo);
}