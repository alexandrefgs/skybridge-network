using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class TourService : ITourService
{
    private readonly IUnitOfWork _uow;
    public TourService(IUnitOfWork uow) => _uow = uow;

    public async Task<IReadOnlyList<TourDto>> ListarAsync()
    {
        var tours = await _uow.Tours.GetAllWithDetailsAsync();
        return tours.Select(MapToDto).ToList();
    }

    public async Task<TourDto?> ObterDetalheAsync(int id)
    {
        var tour = await _uow.Tours.GetWithEtapasAsync(id);
        return tour is null ? null : MapToDto(tour);
    }

    public async Task<TourDto> CriarAsync(NovoTourDto dto)
    {
        var tour = new Tour
        {
            Nome = dto.Nome,
            Descricao = dto.Descricao,
            PontosBonusConclusao = dto.PontosBonusConclusao,
            AwardId = dto.AwardId,
            Etapas = dto.Etapas.Select(e => new TourStop { FlightRouteId = e.FlightRouteId, Ordem = e.Ordem }).ToList()
        };

        await _uow.Tours.AddAsync(tour);
        await _uow.SaveChangesAsync();

        var tourCompleto = await _uow.Tours.GetWithEtapasAsync(tour.Id);
        return MapToDto(tourCompleto!);
    }

    public async Task<Result<string>> DefinirFotoAsync(int tourId, string url)
    {
        var tour = await _uow.Tours.GetByIdAsync(tourId);
        if (tour is null) return Result<string>.Falha("Tour não encontrado.");

        tour.FotoUrl = url;
        await _uow.SaveChangesAsync();
        return Result<string>.Ok("Foto do tour atualizada.");
    }

    public async Task<Result<string>> DefinirFotoCapaAsync(int tourId, string url)
    {
        var tour = await _uow.Tours.GetByIdAsync(tourId);
        if (tour is null) return Result<string>.Falha("Tour não encontrado.");

        tour.FotoCapaUrl = url;
        await _uow.SaveChangesAsync();
        return Result<string>.Ok("Foto de capa do tour atualizada.");
    }

    public async Task<Result<string>> IniciarAsync(int pilotId, int tourId)
    {
        var tour = await _uow.Tours.GetByIdAsync(tourId);
        if (tour is null) return Result<string>.Falha("Tour não encontrado.");

        var existente = await _uow.TourProgresses.GetByPilotAndTourAsync(pilotId, tourId);
        if (existente is not null) return Result<string>.Falha("Piloto já iniciou esse tour.");

        var progresso = new TourProgress { PilotId = pilotId, TourId = tourId, EtapasCompletas = 0, Concluido = false };
        await _uow.TourProgresses.AddAsync(progresso);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok($"Tour \"{tour.Nome}\" iniciado.");
    }

    public async Task<IReadOnlyList<TourProgressoDto>> ListarProgressoDoPilotoAsync(int pilotId)
    {
        var progressos = await _uow.TourProgresses.GetByPilotAsync(pilotId);
        return progressos
            .Select(p => new TourProgressoDto(p.TourId, p.Tour?.Nome ?? string.Empty, p.EtapasCompletas, p.Tour?.Etapas.Count ?? 0, p.Concluido))
            .ToList();
    }

    private static TourDto MapToDto(Tour tour) => new(
        tour.Id, tour.Nome, tour.Descricao, tour.FotoUrl, tour.FotoCapaUrl, tour.PontosBonusConclusao,
        tour.Award?.Nome,
        tour.Etapas
            .OrderBy(e => e.Ordem)
            .Select(e => new EtapaTourDto(e.Ordem, e.FlightRoute!.AeroportoOrigem, e.FlightRoute.AeroportoDestino, e.FlightRoute.NumeroVoo))
            .ToList());
}