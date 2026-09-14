using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class TourStopRepository : Repository<TourStop>, ITourStopRepository
{
    public TourStopRepository(AppDbContext db) : base(db) { }
}