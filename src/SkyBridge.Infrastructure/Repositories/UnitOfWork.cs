using SkyBridge.Domain.Interfaces;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _db;

    public UnitOfWork(AppDbContext db)
    {
        _db = db;
        Airlines = new AirlineRepository(db);
        FlightRoutes = new FlightRouteRepository(db);
        Aircrafts = new AircraftRepository(db);
        Pilots = new PilotRepository(db);
        Ranks = new RankRepository(db);
        PilotCareers = new PilotCareerRepository(db);
        Pireps = new PirepRepository(db);
        RefreshTokens = new RefreshTokenRepository(db);
        Tours = new TourRepository(db);
        TourStops = new TourStopRepository(db);
        TourProgresses = new TourProgressRepository(db);
        Awards = new AwardRepository(db);
        PilotAwards = new PilotAwardRepository(db);
        Bookings = new BookingRepository(db);
        TelemetriaLogs = new TelemetriaLogRepository(db);
        Airports = new AirportRepository(db);
    }

    public IAirlineRepository Airlines { get; }
    public IFlightRouteRepository FlightRoutes { get; }
    public IAircraftRepository Aircrafts { get; }
    public IPilotRepository Pilots { get; }
    public IRankRepository Ranks { get; }
    public IPilotCareerRepository PilotCareers { get; }
    public IPirepRepository Pireps { get; }
    public IRefreshTokenRepository RefreshTokens { get; }
    public ITourRepository Tours { get; }
    public ITourStopRepository TourStops { get; }
    public ITourProgressRepository TourProgresses { get; }
    public IAwardRepository Awards { get; }
    public IPilotAwardRepository PilotAwards { get; }
    public IBookingRepository Bookings { get; }
    public ITelemetriaLogRepository TelemetriaLogs { get; }
    public IAirportRepository Airports { get; }

    public Task<int> SaveChangesAsync() => _db.SaveChangesAsync();
}