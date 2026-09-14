using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class TelemetriaLogRepository : Repository<TelemetriaLog>, ITelemetriaLogRepository
{
    public TelemetriaLogRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<TelemetriaLog>> GetByBookingAsync(int bookingId) =>
        await DbSet
            .Where(t => t.BookingId == bookingId)
            .OrderBy(t => t.RegistradoEmUtc)
            .ToListAsync();
}