using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class VooAtivoService : IVooAtivoService
{
    private static readonly TimeSpan TempoParadoNecessario = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan TempoConfirmacaoTransicao = TimeSpan.FromSeconds(12);

    private readonly IVooAtivoStore _store;
    private readonly IUnitOfWork _uow;

    public VooAtivoService(IVooAtivoStore store, IUnitOfWork uow)
    {
        _store = store;
        _uow = uow;
    }

    public async Task AtualizarAsync(int pilotId, TelemetriaDto dto)
    {
        var pilot = await _uow.Pilots.GetByIdAsync(pilotId);
        if (pilot is null) return;

        _store.Atualizar(new VooAtivo
        {
            PilotId = pilotId,
            Callsign = pilot.Callsign,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            AltitudePes = dto.AltitudePes,
            VelocidadeNos = dto.VelocidadeNos,
            Heading = dto.Heading,
            AtualizadoEm = DateTime.UtcNow
        });

        var booking = await _uow.Bookings.GetEmVooPorPilotoAsync(pilotId);
        if (booking is not null)
        {
            await _uow.TelemetriaLogs.AddAsync(new TelemetriaLog
            {
                BookingId = booking.Id,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                AltitudePes = dto.AltitudePes,
                VelocidadeNos = dto.VelocidadeNos,
                Heading = dto.Heading,
                EstaNoSolo = dto.EstaNoSolo,
                VelocidadeVerticalFpm = dto.VelocidadeVerticalFpm,
                Pitch = dto.Pitch,
                Bank = dto.Bank,
                FlapsPercentual = dto.FlapsPercentual,
                SpoilersArmado = dto.SpoilersArmado,
                SpoilersPercentual = dto.SpoilersPercentual,
                TrainPousoPercentual = dto.TrainPousoPercentual,
                Squawk = dto.Squawk,
                FrequenciaComAtiva = dto.FrequenciaComAtiva,
                AeronaveNome = dto.AeronaveNome
            });

            if (!booking.ProntoParaPirep)
            {
                booking.RegistrarTelemetria(dto.EstaNoSolo, dto.VelocidadeNos, dto.VelocidadeVerticalFpm, DateTime.UtcNow, TempoParadoNecessario, TempoConfirmacaoTransicao);
                _uow.Bookings.Update(booking);
            }

            await _uow.SaveChangesAsync();
        }
    }

    public async Task<IReadOnlyList<VooAtivoDto>> ListarAtivosAsync()
    {
        var ativos = _store.ListarAtivos();
        var resultado = new List<VooAtivoDto>();

        foreach (var v in ativos)
        {
            var booking = await _uow.Bookings.GetEmVooPorPilotoAsync(v.PilotId);
            string callsign = v.Callsign;
            string? aeronave = null;
            string? aeronaveIcao = null;
            string? origem = null;
            string? destino = null;

            if (booking is not null)
            {
                var detalhe = await _uow.Bookings.GetComDetalhesAsync(booking.Id);
                if (detalhe is not null)
                {
                    callsign = detalhe.Callsign;
                    aeronave = detalhe.Aircraft?.Modelo;
                    aeronaveIcao = detalhe.Aircraft?.CodigoIcao;
                    origem = detalhe.FlightRoute?.AeroportoOrigem;
                    destino = detalhe.FlightRoute?.AeroportoDestino;
                }
            }

            resultado.Add(new VooAtivoDto(
                v.PilotId, callsign, v.Latitude, v.Longitude, v.AltitudePes, v.VelocidadeNos, v.Heading, v.AtualizadoEm,
                aeronave, aeronaveIcao, origem, destino
            ));
        }

        return resultado;
    }
}