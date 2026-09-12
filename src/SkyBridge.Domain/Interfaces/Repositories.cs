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
}

public interface IRefreshTokenRepository : IRepository<RefreshToken>
{
    Task<RefreshToken?> GetByTokenHashAsync(string tokenHash);
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

    Task<int> SaveChangesAsync();
}