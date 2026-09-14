using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Enums;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Domain.Services;

namespace SkyBridge.Application.Services;

public class PirepService : IPirepService
{
    private readonly IUnitOfWork _uow;
    private readonly ILandingEvaluator _landingEvaluator;
    private readonly IAwardService _awardService;

    public PirepService(IUnitOfWork uow, ILandingEvaluator landingEvaluator, IAwardService awardService)
    {
        _uow = uow;
        _landingEvaluator = landingEvaluator;
        _awardService = awardService;
    }

    public async Task<Result<PirepResultDto>> EnviarAsync(int pilotId, NovoPirepDto dto)
    {
        var pilot = await _uow.Pilots.GetByIdAsync(pilotId);
        var rota = await _uow.FlightRoutes.GetByIdAsync(dto.FlightRouteId);
        var aircraft = await _uow.Aircrafts.GetByIdAsync(dto.AircraftId);
        if (pilot is null || rota is null || aircraft is null)
            return Result<PirepResultDto>.Falha("Piloto, rota ou aeronave não encontrados.");

        if (pilot.Rating < rota.RatingMinimo)
            return Result<PirepResultDto>.Falha(
                $"Rating insuficiente. Rota exige {rota.RatingMinimo:0.0} estrelas, piloto tem {pilot.Rating:0.0}.");

        var avaliacao = _landingEvaluator.Avaliar(dto.TaxaDescidaTouchdownFpm);
        var pontosGanhos = (long)Math.Round(rota.DistanciaMilhas * avaliacao.MultiplicadorPontos);

        pilot.AdicionarPontos(pontosGanhos);
        pilot.AjustarRating(avaliacao.ImpactoNoRating);

        var carreira = await _uow.PilotCareers.GetByPilotAndAirlineAsync(pilotId, rota.AirlineId);
        string? novaPatente = null;

        if (carreira is not null)
        {
            carreira.RegistrarHoras(dto.HorasDeVoo);

            var nivelAtual = carreira.RankAtual?.Nivel ?? 0;
            var proximoRank = await _uow.Ranks.GetProximoRankElegivelAsync(
                rota.AirlineId, nivelAtual, carreira.HorasVoadas, pilot.Rating);

            if (proximoRank is not null)
            {
                carreira.RankAtualId = proximoRank.Id;
                novaPatente = proximoRank.Nome;

                var airline = await _uow.Airlines.GetByIdAsync(rota.AirlineId);
                var nomeAward = airline is not null ? $"{proximoRank.Nome} — {airline.Nome}" : proximoRank.Nome;
                var awardPatente = await _awardService.ObterOuCriarPatenteAsync(proximoRank.Id, nomeAward);

                if (!await _uow.PilotAwards.PilotJaTemAwardAsync(pilotId, awardPatente.Id))
                    await _uow.PilotAwards.AddAsync(new PilotAward { PilotId = pilotId, AwardId = awardPatente.Id });
            }
        }

        var status = avaliacao.Qualidade == LandingQuality.EmAnalise
            ? PirepStatus.PendenteAprovacao
            : avaliacao.Qualidade == LandingQuality.Rejeitado
                ? PirepStatus.Rejeitado
                : PirepStatus.Aprovado;

        Enum.TryParse<RedeOnline>(dto.Rede, out var rede);

        var pirep = new Pirep
        {
            PilotId = pilotId,
            FlightRouteId = dto.FlightRouteId,
            AircraftId = dto.AircraftId,
            HorasDeVoo = dto.HorasDeVoo,
            TaxaDescidaTouchdownFpm = dto.TaxaDescidaTouchdownFpm,
            QualidadePouso = avaliacao.Qualidade,
            Rede = rede,
            PontosGanhos = pontosGanhos,
            ImpactoNoRating = avaliacao.ImpactoNoRating,
            Status = status,
            BookingId = dto.BookingId
        };

        await _uow.Pireps.AddAsync(pirep);
        await _uow.SaveChangesAsync();

        if (status == PirepStatus.Aprovado)
            await AvancarToursAsync(pilotId, dto.FlightRouteId);

        var resultado = new PirepResultDto(
            pirep.Id,
            pirep.QualidadePouso.ToString(),
            pirep.PontosGanhos,
            pirep.Status.ToString(),
            pilot.Rating,
            pilot.PontosTotais,
            novaPatente);

        return Result<PirepResultDto>.Ok(resultado);
    }

    public async Task<IReadOnlyList<PirepPendenteDto>> ListarPendentesAsync()
    {
        var pendentes = await _uow.Pireps.GetPendentesAsync();
        return pendentes
            .Select(p => new PirepPendenteDto(
                p.Id,
                p.Pilot?.Callsign ?? string.Empty,
                p.Pilot?.Nome ?? string.Empty,
                p.FlightRoute is not null ? $"{p.FlightRoute.Airline?.CallsignPadrao}{p.FlightRoute.NumeroVoo}" : string.Empty,
                p.FlightRoute?.AeroportoOrigem ?? string.Empty,
                p.FlightRoute?.AeroportoDestino ?? string.Empty,
                p.Aircraft?.Modelo ?? string.Empty,
                p.FlightRoute?.DistanciaMilhas ?? 0,
                p.TaxaDescidaTouchdownFpm,
                p.DataVoo))
            .ToList();
    }

    public async Task<Result<string>> AprovarAsync(int pirepId)
    {
        var pirep = await _uow.Pireps.GetByIdAsync(pirepId);
        if (pirep is null)
            return Result<string>.Falha("PIREP não encontrado.");

        if (pirep.Status != PirepStatus.PendenteAprovacao)
            return Result<string>.Falha("Esse PIREP já foi avaliado.");

        pirep.Status = PirepStatus.Aprovado;
        await _uow.SaveChangesAsync();

        await AvancarToursAsync(pirep.PilotId, pirep.FlightRouteId);

        return Result<string>.Ok("PIREP aprovado.");
    }

    public async Task<Result<string>> RejeitarAsync(int pirepId, string motivo)
    {
        var pirep = await _uow.Pireps.GetByIdAsync(pirepId);
        if (pirep is null)
            return Result<string>.Falha("PIREP não encontrado.");

        if (pirep.Status != PirepStatus.PendenteAprovacao)
            return Result<string>.Falha("Esse PIREP já foi avaliado.");

        var pilot = await _uow.Pilots.GetByIdAsync(pirep.PilotId);
        if (pilot is not null)
        {
            pilot.AdicionarPontos(-pirep.PontosGanhos);
            pilot.AjustarRating(-pirep.ImpactoNoRating);
        }

        pirep.Status = PirepStatus.Rejeitado;
        pirep.Observacoes = motivo;
        await _uow.SaveChangesAsync();

        return Result<string>.Ok("PIREP rejeitado.");
    }

    public async Task<IReadOnlyList<UltimoVooDto>> ListarUltimosAsync(int quantidade, int? pilotoId = null)
    {
        var pireps = await _uow.Pireps.GetUltimosAsync(quantidade, pilotoId);
        return pireps.Select(MapParaUltimoVoo).ToList();
    }

    public async Task<PirepDetalheDto?> ObterDetalheAsync(int id)
    {
        var pirep = await _uow.Pireps.GetComDetalhesAsync(id);
        if (pirep is null) return null;

        return new PirepDetalheDto(
        pirep.Id,
        pirep.Pilot?.Callsign ?? string.Empty,
        pirep.Pilot?.Nome ?? string.Empty,
        pirep.FlightRoute is not null ? $"{pirep.FlightRoute.Airline?.CallsignPadrao}{pirep.FlightRoute.NumeroVoo}" : string.Empty,
        pirep.FlightRoute?.AeroportoOrigem ?? string.Empty,
        pirep.FlightRoute?.AeroportoDestino ?? string.Empty,
        pirep.Aircraft?.Modelo ?? string.Empty,
        pirep.Aircraft?.CodigoIcao ?? string.Empty,
        pirep.HorasDeVoo,
        pirep.TaxaDescidaTouchdownFpm,
        pirep.QualidadePouso.ToString(),
        pirep.PontosGanhos,
        pirep.ImpactoNoRating,
        pirep.Status.ToString(),
        pirep.Rede.ToString(),
        pirep.DataVoo,
        pirep.Observacoes);
    }

    private static UltimoVooDto MapParaUltimoVoo(Pirep p) => new(
        p.Id,
        p.Pilot?.Callsign ?? string.Empty,
        p.Pilot?.Nome ?? string.Empty,
        p.FlightRoute is not null ? $"{p.FlightRoute.Airline?.CallsignPadrao}{p.FlightRoute.NumeroVoo}" : string.Empty,
        p.FlightRoute?.AeroportoOrigem ?? string.Empty,
        p.FlightRoute?.AeroportoDestino ?? string.Empty,
        p.HorasDeVoo,
        p.Aircraft?.Modelo ?? string.Empty,
        p.Rede.ToString(),
        p.Status.ToString(),
        p.DataVoo,
        p.FlightRoute?.Airline?.Nome ?? string.Empty);

    private async Task AvancarToursAsync(int pilotId, int flightRouteId)
    {
        var progressos = await _uow.TourProgresses.GetEmAndamentoPorPilotoERotaAsync(pilotId, flightRouteId);

        foreach (var progresso in progressos)
        {
            progresso.EtapasCompletas++;

            var totalEtapas = progresso.Tour!.Etapas.Count;
            if (progresso.EtapasCompletas < totalEtapas) continue;

            progresso.Concluido = true;

            var pilot = await _uow.Pilots.GetByIdAsync(pilotId);
            pilot?.AdicionarPontos(progresso.Tour.PontosBonusConclusao);

            if (progresso.Tour.AwardId is int awardId
                && !await _uow.PilotAwards.PilotJaTemAwardAsync(pilotId, awardId))
            {
                await _uow.PilotAwards.AddAsync(new PilotAward { PilotId = pilotId, AwardId = awardId });
            }
        }

        await _uow.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<TelemetriaLogDto>?> ObterTelemetriaAsync(int pirepId, int solicitanteId, bool ehAdmin)
    {
        var pirep = await _uow.Pireps.GetByIdAsync(pirepId);
        if (pirep is null || pirep.BookingId is null) return null;

        var logs = await _uow.TelemetriaLogs.GetByBookingAsync(pirep.BookingId.Value);
        return logs.Select(t => new TelemetriaLogDto(
            t.Latitude, t.Longitude, t.AltitudePes, t.VelocidadeNos, t.Heading, t.EstaNoSolo, t.VelocidadeVerticalFpm,
            t.Pitch, t.Bank, t.FlapsPercentual, t.SpoilersArmado, t.SpoilersPercentual, t.TrainPousoPercentual,
            t.Squawk, t.FrequenciaComAtiva, t.AeronaveNome, t.RegistradoEmUtc))
            .ToList();
    }
}