using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;

namespace SkyBridge.Application.Interfaces;

public interface IBookingService
{
    Task<Result<BookingDto>> CriarAsync(int pilotId, NovoBookingDto dto);
    Task<Result<string>> DefinirAlternadosAsync(int pilotId, int bookingId, AlternadosDto dto);
    Task<Result<string>> DefinirPerfilSimBriefAsync(int pilotId, int bookingId, PerfilSimBriefDto dto);
    Task<Result<string>> DefinirPayloadAsync(int pilotId, int bookingId, PayloadDto dto);
    Task<Result<SimBriefRedirectDto>> ObterRedirectSimBriefAsync(int pilotId, int bookingId);
    Task<Result<BookingDto>> ConfirmarOfpAsync(int pilotId, int bookingId);
    Task<Result<string>> IniciarVooAsync(int pilotId, int bookingId);
    Task<Result<StatusVooDto>> ObterStatusVooAsync(int pilotId, int bookingId);
    Task<Result<PirepResultDto>> EnviarPirepAsync(int pilotId, int bookingId);
    Task<IReadOnlyList<BookingDto>> ListarMeusAsync(int pilotId);
    Task<BookingDto?> ObterDetalheAsync(int pilotId, int bookingId);
    Task<Result<string>> ExcluirAsync(int pilotId, int bookingId);
    Task<Result<string>> CancelarVooAsync(int pilotId, int bookingId);
}