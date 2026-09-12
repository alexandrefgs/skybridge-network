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
    Task<Result<string>> ExcluirAsync(int id);
}

public interface IPirepService
{
    Task<Result<PirepResultDto>> EnviarAsync(NovoPirepDto dto);
    Task<IReadOnlyList<Pirep>> ListarPendentesAsync();
}

public interface IAuthService
{
    Task<Result<AuthResponseDto>> RegistrarAsync(RegistroPilotoDto dto);
    Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto);
    Task<Result<AuthResponseDto>> RefreshAsync(RefreshTokenDto dto);
    Task LogoutAsync(RefreshTokenDto dto);
}