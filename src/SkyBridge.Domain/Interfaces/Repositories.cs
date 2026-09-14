using SkyBridge.Domain.Entities;

namespace SkyBridge.Domain.Interfaces;

public interface IAirlineRepository : IRepository<Airline>
{
    Task<Airline?> GetWithDetailsAsync(int id);
}

public interface IFlightRouteRepository : IRepository<FlightRoute>
{
    Task<IReadOnlyList<FlightRoute>> GetByAirlineAsync(int airlineId);
}

public interface IAircraftRepository : IRepository<Aircraft>
{
}

public interface IPilotRepository : IRepository<Pilot>
{
    Task<Pilot?> GetWithCareerDetailsAsync(int id);
    Task<Pilot?> GetByEmailAsync(string email);
    Task<int> GetProximoNumeroCallsignAsync();
}

public interface IRankRepository : IRepository<Rank>
{
    Task<Rank?> GetRankInicialDaCompanhiaAsync(int airlineId);
    Task<Rank?> GetProximoRankElegivelAsync(int airlineId, int nivelAtual, double horasVoadas, double rating);
}

public interface IPilotCareerRepository : IRepository<PilotCareer>
{
    Task<PilotCareer?> GetByPilotAndAirlineAsync(int pilotId, int airlineId);
}

public interface IPirepRepository : IRepository<Pirep>
{
    Task<IReadOnlyList<Pirep>> GetPendentesAsync();
    Task<IReadOnlyList<Pirep>> GetUltimosAsync(int quantidade, int? pilotoId = null);
    Task<Pirep?> GetComDetalhesAsync(int id);
}

public interface IRefreshTokenRepository : IRepository<RefreshToken>
{
    Task<RefreshToken?> GetByTokenHashAsync(string tokenHash);
}

public interface ITourRepository : IRepository<Tour>
{
    Task<Tour?> GetWithEtapasAsync(int id);
    Task<IReadOnlyList<Tour>> GetAllWithDetailsAsync();
}

public interface ITourStopRepository : IRepository<TourStop>
{
}

public interface ITourProgressRepository : IRepository<TourProgress>
{
    Task<IReadOnlyList<TourProgress>> GetByPilotAsync(int pilotId);
    Task<TourProgress?> GetByPilotAndTourAsync(int pilotId, int tourId);
    Task<IReadOnlyList<TourProgress>> GetEmAndamentoPorPilotoERotaAsync(int pilotId, int flightRouteId);
    Task<IReadOnlyList<TourProgress>> GetByTourAsync(int tourId);
}

public interface IAwardRepository : IRepository<Award>
{
}

public interface IPilotAwardRepository : IRepository<PilotAward>
{
    Task<bool> PilotJaTemAwardAsync(int pilotId, int awardId);
    Task<IReadOnlyList<PilotAward>> GetByPilotAsync(int pilotId);
    Task<IReadOnlyList<PilotAward>> GetByAwardAsync(int awardId);
}

public interface IBookingRepository : IRepository<Booking>
{
    Task<Booking?> GetComDetalhesAsync(int id);
    Task<IReadOnlyList<Booking>> GetByPilotAsync(int pilotId);
    Task<Booking?> GetEmVooPorPilotoAsync(int pilotId);
    Task<Booking?> GetPendentePorPilotoAsync(int pilotId);
}

public interface ITelemetriaLogRepository : IRepository<TelemetriaLog>
{
    Task<IReadOnlyList<TelemetriaLog>> GetByBookingAsync(int bookingId);
}

public interface IUnitOfWork
{
    IAirlineRepository Airlines { get; }
    IFlightRouteRepository FlightRoutes { get; }
    IAircraftRepository Aircrafts { get; }
    IPilotRepository Pilots { get; }
    IRankRepository Ranks { get; }
    IPilotCareerRepository PilotCareers { get; }
    IPirepRepository Pireps { get; }
    IRefreshTokenRepository RefreshTokens { get; }
    ITourRepository Tours { get; }
    ITourStopRepository TourStops { get; }
    ITourProgressRepository TourProgresses { get; }
    IAwardRepository Awards { get; }
    IPilotAwardRepository PilotAwards { get; }
    IBookingRepository Bookings { get; }
    ITelemetriaLogRepository TelemetriaLogs { get; }

    Task<int> SaveChangesAsync();
}