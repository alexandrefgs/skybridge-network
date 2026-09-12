using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Domain.Entities;

namespace SkyBridge.Application.Interfaces;

public interface IAirlineService
{
    Task<IReadOnlyList<AirlineDto>> ListarAsync();
    Task<Airline?> ObterDetalheAsync(int id);
    Task<IReadOnlyList<FlightRouteDto>> ListarRotasAsync(int airlineId);
}

public interface IPilotService
{
    Task<IReadOnlyList<PilotoResumoDto>> ListarAsync();
    Task<PilotoDetalheDto?> ObterDetalheAsync(int id);
    Task<PilotoResumoDto> CriarAsync(NovoPilotoDto dto);
    Task<Result<string>> IniciarCarreiraAsync(int pilotId, int airlineId);
}

public interface IPirepService
{
    Task<Result<PirepResultDto>> EnviarAsync(NovoPirepDto dto);
    Task<IReadOnlyList<Pirep>> ListarPendentesAsync();
}