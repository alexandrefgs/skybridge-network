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

    public PirepService(IUnitOfWork uow, ILandingEvaluator landingEvaluator)
    {
        _uow = uow;
        _landingEvaluator = landingEvaluator;
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
            }
        }

        var status = avaliacao.Qualidade == LandingQuality.MuitoForte
            ? PirepStatus.PendenteAprovacao
            : PirepStatus.Aprovado;

        var pirep = new Pirep
        {
            PilotId = pilotId,
            FlightRouteId = dto.FlightRouteId,
            AircraftId = dto.AircraftId,
            HorasDeVoo = dto.HorasDeVoo,
            TaxaDescidaTouchdownFpm = dto.TaxaDescidaTouchdownFpm,
            QualidadePouso = avaliacao.Qualidade,
            PontosGanhos = pontosGanhos,
            ImpactoNoRating = avaliacao.ImpactoNoRating,
            Status = status
        };

        await _uow.Pireps.AddAsync(pirep);
        await _uow.SaveChangesAsync();

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
                p.FlightRoute is not null ? $"{p.FlightRoute.AeroportoOrigem} → {p.FlightRoute.AeroportoDestino}" : string.Empty,
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
}