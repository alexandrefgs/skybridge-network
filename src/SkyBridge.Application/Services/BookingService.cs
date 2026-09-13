using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class BookingService : IBookingService
{
    private static readonly TimeSpan LimiteInatividade = TimeSpan.FromMinutes(5);

    private readonly IUnitOfWork _uow;
    private readonly ISimBriefClient _simBrief;
    private readonly IPirepService _pirepService;

    public BookingService(IUnitOfWork uow, ISimBriefClient simBrief, IPirepService pirepService)
    {
        _uow = uow;
        _simBrief = simBrief;
        _pirepService = pirepService;
    }

    public async Task<Result<BookingDto>> CriarAsync(int pilotId, NovoBookingDto dto)
    {
        var pilot = await _uow.Pilots.GetByIdAsync(pilotId);
        if (pilot is null) return Result<BookingDto>.Falha("Piloto não encontrado.");

        var rota = await _uow.FlightRoutes.GetByIdAsync(dto.FlightRouteId);
        if (rota is null) return Result<BookingDto>.Falha("Rota não encontrada.");

        var aeronave = await _uow.Aircrafts.GetByIdAsync(dto.AircraftId);
        if (aeronave is null) return Result<BookingDto>.Falha("Aeronave não encontrada.");

        if (aeronave.AirlineId != rota.AirlineId)
            return Result<BookingDto>.Falha("Essa aeronave não pertence à companhia dessa rota.");

        if (!aeronave.TiposOperacaoSuportados.Contains(rota.TipoOperacao))
            return Result<BookingDto>.Falha($"Essa aeronave não suporta o tipo de operação {rota.TipoOperacao}.");

        if (pilot.Rating < rota.RatingMinimo)
            return Result<BookingDto>.Falha($"Rating insuficiente. Mínimo exigido: {rota.RatingMinimo}★.");

        var airline = await _uow.Airlines.GetByIdAsync(rota.AirlineId);
        if (airline is null) return Result<BookingDto>.Falha("Companhia da rota não encontrada.");

        var booking = new Booking
        {
            PilotId = pilotId,
            FlightRouteId = rota.Id,
            AircraftId = aeronave.Id,
            DataVooUtc = dto.DataVoo.ToDateTime(TimeOnly.MinValue),
            HorarioPartidaUtc = new TimeOnly(dto.HoraPartidaUtc, dto.MinutoPartidaUtc),
            HorarioChegadaUtc = new TimeOnly(dto.HoraChegadaUtc, dto.MinutoChegadaUtc)
        };

        try
        {
            booking.DefinirCallsign(dto.Callsign, airline.CallsignPadrao);
        }
        catch (InvalidOperationException ex)
        {
            return Result<BookingDto>.Falha(ex.Message);
        }

        await _uow.Bookings.AddAsync(booking);
        await _uow.SaveChangesAsync();

        return Result<BookingDto>.Ok(MapearDto(booking, rota, aeronave));
    }

    public async Task<Result<string>> DefinirAlternadosAsync(int pilotId, int bookingId, AlternadosDto dto)
    {
        var booking = await ObterDoTitularAsync(pilotId, bookingId);
        if (booking is null) return Result<string>.Falha("Booking não encontrado.");

        booking.DefinirAlternados(dto.Alternado1, dto.Alternado2, dto.Alternado3, dto.Alternado4);
        _uow.Bookings.Update(booking);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok("Alternados definidos.");
    }

    public async Task<Result<string>> DefinirPerfilSimBriefAsync(int pilotId, int bookingId, PerfilSimBriefDto dto)
    {
        var booking = await ObterDoTitularAsync(pilotId, bookingId);
        if (booking is null) return Result<string>.Falha("Booking não encontrado.");

        booking.SimBriefPerfilId = dto.SimBriefPerfilId;
        _uow.Bookings.Update(booking);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok("Perfil SimBrief definido.");
    }

    public async Task<Result<string>> DefinirPayloadAsync(int pilotId, int bookingId, PayloadDto dto)
    {
        var booking = await ObterDoTitularAsync(pilotId, bookingId);
        if (booking is null) return Result<string>.Falha("Booking não encontrado.");

        booking.PayloadPassageiros = dto.PayloadPassageiros;
        booking.PayloadCargaKg = dto.PayloadCargaKg;
        _uow.Bookings.Update(booking);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok("Payload definido.");
    }

    public async Task<Result<SimBriefRedirectDto>> ObterRedirectSimBriefAsync(int pilotId, int bookingId)
    {
        var booking = await _uow.Bookings.GetComDetalhesAsync(bookingId);
        if (booking is null || booking.PilotId != pilotId)
            return Result<SimBriefRedirectDto>.Falha("Booking não encontrado.");

        var airline = booking.FlightRoute!.Airline!;

        var parametros = new SimBriefDispatchParametros(
            Airline: airline.ICAO,
            NumeroVoo: booking.FlightRoute.NumeroVoo,
            TipoAeronaveIcao: booking.Aircraft!.CodigoIcao,
            Origem: booking.FlightRoute.AeroportoOrigem,
            Destino: booking.FlightRoute.AeroportoDestino,
            Data: DateOnly.FromDateTime(booking.DataVooUtc),
            HoraPartida: booking.HorarioPartidaUtc.Hour,
            MinutoPartida: booking.HorarioPartidaUtc.Minute,
            Registro: booking.Aircraft.Matricula,
            Callsign: booking.Callsign,
            Passageiros: booking.PayloadPassageiros,
            StaticId: $"SKB_{booking.Id}"
        );

        var url = _simBrief.MontarUrlDispatch(parametros);
        return Result<SimBriefRedirectDto>.Ok(new SimBriefRedirectDto(url));
    }

    public async Task<Result<BookingDto>> ConfirmarOfpAsync(int pilotId, int bookingId)
    {
        var pilot = await _uow.Pilots.GetByIdAsync(pilotId);
        if (pilot is null) return Result<BookingDto>.Falha("Piloto não encontrado.");

        if (string.IsNullOrWhiteSpace(pilot.SimBriefUsername))
            return Result<BookingDto>.Falha("Cadastre seu SimBrief Username no perfil antes de continuar.");

        var booking = await _uow.Bookings.GetComDetalhesAsync(bookingId);
        if (booking is null || booking.PilotId != pilotId)
            return Result<BookingDto>.Falha("Booking não encontrado.");

        var ofp = await _simBrief.BuscarOfpPorStaticIdAsync(pilot.SimBriefUsername, $"SKB_{booking.Id}");

        if (!ofp.Encontrado)
            return Result<BookingDto>.Falha("Nenhum plano de voo encontrado no SimBrief para esse booking. Gere o OFP primeiro.");

        booking.MarcarBriefingGerado($"SKB_{booking.Id}");
        _uow.Bookings.Update(booking);
        await _uow.SaveChangesAsync();

        return Result<BookingDto>.Ok(MapearDto(booking, booking.FlightRoute!, booking.Aircraft!));
    }

    public async Task<Result<string>> IniciarVooAsync(int pilotId, int bookingId)
    {
        var booking = await ObterDoTitularAsync(pilotId, bookingId);
        if (booking is null) return Result<string>.Falha("Booking não encontrado.");

        if (booking.Status != Domain.Enums.BookingStatus.BriefingGerado)
            return Result<string>.Falha("Confirme o plano de voo (OFP) antes de iniciar o voo.");

        var jaEmVoo = await _uow.Bookings.GetEmVooPorPilotoAsync(pilotId);
        if (jaEmVoo is not null)
            return Result<string>.Falha("Você já tem um voo em andamento.");

        booking.IniciarVoo();
        _uow.Bookings.Update(booking);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok("Voo iniciado.");
    }

    public async Task<Result<StatusVooDto>> ObterStatusVooAsync(int pilotId, int bookingId)
    {
        var booking = await ObterDoTitularAsync(pilotId, bookingId);
        if (booking is null) return Result<StatusVooDto>.Falha("Booking não encontrado.");

        if (booking.DeveSerCanceladoPorInatividade(DateTime.UtcNow, LimiteInatividade))
        {
            booking.Cancelar();
            _uow.Bookings.Update(booking);
            await _uow.SaveChangesAsync();
        }

        return Result<StatusVooDto>.Ok(new StatusVooDto(
            booking.Status.ToString(), booking.ProntoParaPirep, booking.CalcularHorasDeVoo(), booking.TaxaDescidaTouchdownFpm));
    }

    public async Task<Result<PirepResultDto>> EnviarPirepAsync(int pilotId, int bookingId)
    {
        var booking = await ObterDoTitularAsync(pilotId, bookingId);
        if (booking is null) return Result<PirepResultDto>.Falha("Booking não encontrado.");

        if (!booking.ProntoParaPirep)
            return Result<PirepResultDto>.Falha("O voo ainda não foi detectado como concluído.");

        var horasDeVoo = booking.CalcularHorasDeVoo() ?? 0;
        var dto = new NovoPirepDto(booking.FlightRouteId, booking.AircraftId, horasDeVoo, booking.TaxaDescidaTouchdownFpm ?? 0);

        var resultado = await _pirepService.EnviarAsync(pilotId, dto);
        if (!resultado.Sucesso) return resultado;

        booking.MarcarConcluido();
        _uow.Bookings.Update(booking);
        await _uow.SaveChangesAsync();

        return resultado;
    }

    public async Task<IReadOnlyList<BookingDto>> ListarMeusAsync(int pilotId)
    {
        var bookings = await _uow.Bookings.GetByPilotAsync(pilotId);
        return bookings.Select(b => MapearDto(b, b.FlightRoute!, b.Aircraft!)).ToList();
    }

    public async Task<BookingDto?> ObterDetalheAsync(int pilotId, int bookingId)
    {
        var booking = await _uow.Bookings.GetComDetalhesAsync(bookingId);
        if (booking is null || booking.PilotId != pilotId) return null;

        return MapearDto(booking, booking.FlightRoute!, booking.Aircraft!);
    }

    private async Task<Booking?> ObterDoTitularAsync(int pilotId, int bookingId)
    {
        var booking = await _uow.Bookings.GetByIdAsync(bookingId);
        if (booking is null || booking.PilotId != pilotId) return null;
        return booking;
    }

    private static BookingDto MapearDto(Booking b, FlightRoute rota, Aircraft aeronave) => new(
    b.Id, b.Callsign, rota.AeroportoOrigem, rota.AeroportoDestino, rota.NumeroVoo,
    aeronave.Modelo, aeronave.CodigoIcao, aeronave.Matricula, b.Status.ToString(),
    b.DataVooUtc, b.SimBriefPerfilId, b.SimBriefOfpId,
    b.Alternado1, b.Alternado2, b.Alternado3, b.Alternado4,
    b.PayloadPassageiros, b.PayloadCargaKg
);
}