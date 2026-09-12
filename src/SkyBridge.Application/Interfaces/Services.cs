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
    Task<Result<PirepResultDto>> EnviarAsync(int pilotId, NovoPirepDto dto);
    Task<IReadOnlyList<PirepPendenteDto>> ListarPendentesAsync();
    Task<Result<string>> AprovarAsync(int pirepId);
    Task<Result<string>> RejeitarAsync(int pirepId, string motivo);
}

public interface IAuthService
{
    Task<Result<AuthResponseDto>> RegistrarAsync(RegistroPilotoDto dto);
    Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto);
    Task<Result<AuthResponseDto>> RefreshAsync(RefreshTokenDto dto);
    Task LogoutAsync(RefreshTokenDto dto);
}

public interface ITourService
{
    Task<IReadOnlyList<TourDto>> ListarAsync();
    Task<TourDto?> ObterDetalheAsync(int id);
    Task<TourDto> CriarAsync(NovoTourDto dto);
    Task<Result<string>> DefinirFotoAsync(int tourId, string url);
    Task<Result<string>> DefinirFotoCapaAsync(int tourId, string url);
    Task<Result<string>> IniciarAsync(int pilotId, int tourId);
    Task<IReadOnlyList<TourProgressoDto>> ListarProgressoDoPilotoAsync(int pilotId);
}

public interface IAwardService
{
    Task<IReadOnlyList<AwardDto>> ListarAsync();
    Task<AwardDto?> ObterDetalheAsync(int id);
    Task<AwardDto> CriarAsync(NovoAwardDto dto);
    Task<Result<string>> DefinirImagemAsync(int id, string url);
}

public interface IVooAtivoService
{
    Task AtualizarAsync(int pilotId, TelemetriaDto dto);
    Task<IReadOnlyList<VooAtivoDto>> ListarAtivosAsync();
}