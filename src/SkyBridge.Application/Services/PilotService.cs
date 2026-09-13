using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class PilotService : IPilotService
{
    private readonly IUnitOfWork _uow;
    public PilotService(IUnitOfWork uow) => _uow = uow;

    public async Task<IReadOnlyList<PilotoResumoDto>> ListarAsync()
    {
        var pilots = await _uow.Pilots.GetAllAsync();
        return pilots
            .OrderByDescending(p => p.PontosTotais)
            .Select(p => new PilotoResumoDto(p.Id, p.Nome, p.Callsign, p.Rating, p.PontosTotais))
            .ToList();
    }

    public async Task<PilotoDetalheDto?> ObterDetalheAsync(int id)
    {
        var pilot = await _uow.Pilots.GetWithCareerDetailsAsync(id);
        if (pilot is null) return null;

        var carreiras = pilot.Carreiras
            .Select(c => new CarreiraDto(
                c.AirlineId,
                c.Airline?.Nome ?? string.Empty,
                c.HorasVoadas,
                c.RankAtual?.Nome ?? string.Empty))
            .ToList();

        var pilotAwards = await _uow.PilotAwards.GetByPilotAsync(id);
        var awards = pilotAwards
            .Select(pa => new AwardConquistadoDto(
                pa.Award?.Nome ?? string.Empty,
                pa.Award?.Descricao,
                pa.Award?.ImagemUrl,
                pa.DataConquista))
            .ToList();

        return new PilotoDetalheDto(pilot.Id, pilot.Nome, pilot.Callsign, pilot.Rating, pilot.PontosTotais, carreiras, awards);
    }

    public async Task<PilotoResumoDto> CriarAsync(NovoPilotoDto dto)
    {
        var pilot = new Pilot
        {
            Nome = dto.Nome,
            Callsign = dto.Callsign,
            Email = dto.Email,
            Rating = 3.0,
            PontosTotais = 0
        };

        await _uow.Pilots.AddAsync(pilot);
        await _uow.SaveChangesAsync();

        return new PilotoResumoDto(pilot.Id, pilot.Nome, pilot.Callsign, pilot.Rating, pilot.PontosTotais);
    }

    public async Task<Result<string>> IniciarCarreiraAsync(int pilotId, int airlineId)
    {
        var pilot = await _uow.Pilots.GetByIdAsync(pilotId);
        var airline = await _uow.Airlines.GetByIdAsync(airlineId);
        if (pilot is null || airline is null)
            return Result<string>.Falha("Piloto ou companhia não encontrados.");

        var existente = await _uow.PilotCareers.GetByPilotAndAirlineAsync(pilotId, airlineId);
        if (existente is not null)
            return Result<string>.Falha("Piloto já tem carreira nessa companhia.");

        var rankInicial = await _uow.Ranks.GetRankInicialDaCompanhiaAsync(airlineId);
        if (rankInicial is null)
            return Result<string>.Falha("Essa companhia ainda não tem patentes cadastradas.");

        var carreira = new PilotCareer
        {
            PilotId = pilotId,
            AirlineId = airlineId,
            HorasVoadas = 0,
            RankAtualId = rankInicial.Id
        };

        await _uow.PilotCareers.AddAsync(carreira);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok($"Carreira iniciada como {rankInicial.Nome}.");
    }

    public async Task<Result<string>> DefinirSimBriefUsernameAsync(int pilotId, string simBriefUsername)
    {
        var pilot = await _uow.Pilots.GetByIdAsync(pilotId);
        if (pilot is null)
            return Result<string>.Falha("Piloto não encontrado.");

        pilot.DefinirSimBriefUsername(simBriefUsername.Trim());
        _uow.Pilots.Update(pilot);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok("SimBrief Username salvo.");
    }

    public async Task<Result<string>> ExcluirAsync(int id)
    {
        var pilot = await _uow.Pilots.GetByIdAsync(id);
        if (pilot is null)
            return Result<string>.Falha("Piloto não encontrado.");

        _uow.Pilots.Remove(pilot);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok($"Piloto {pilot.Callsign} excluído. O número fica disponível para o próximo cadastro.");
    }
}