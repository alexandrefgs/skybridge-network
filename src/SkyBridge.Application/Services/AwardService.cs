using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Enums;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class AwardService : IAwardService
{
    private readonly IUnitOfWork _uow;
    public AwardService(IUnitOfWork uow) => _uow = uow;

    public async Task<IReadOnlyList<AwardDto>> ListarAsync()
    {
        var awards = await _uow.Awards.GetAllAsync();
        return awards.Select(MapToDto).ToList();
    }

    public async Task<AwardDto?> ObterDetalheAsync(int id)
    {
        var award = await _uow.Awards.GetByIdAsync(id);
        return award is null ? null : MapToDto(award);
    }

    public async Task<AwardDto> CriarAsync(NovoAwardDto dto)
    {
        var award = new Award { Nome = dto.Nome, Descricao = dto.Descricao };
        await _uow.Awards.AddAsync(award);
        await _uow.SaveChangesAsync();
        return MapToDto(award);
    }

    public async Task<Result<string>> DefinirImagemAsync(int id, string url)
    {
        var award = await _uow.Awards.GetByIdAsync(id);
        if (award is null) return Result<string>.Falha("Award não encontrado.");

        award.ImagemUrl = url;
        await _uow.SaveChangesAsync();
        return Result<string>.Ok("Imagem do award atualizada.");
    }

    public async Task<Result<AwardDto>> AtualizarAsync(int id, NovoAwardDto dto)
    {
        var award = await _uow.Awards.GetByIdAsync(id);
        if (award is null) return Result<AwardDto>.Falha("Award não encontrada.");

        award.Nome = dto.Nome;
        award.Descricao = dto.Descricao;
        await _uow.SaveChangesAsync();

        return Result<AwardDto>.Ok(MapToDto(award));
    }

    public async Task<Result<string>> ExcluirAsync(int id)
    {
        var award = await _uow.Awards.GetByIdAsync(id);
        if (award is null) return Result<string>.Falha("Award não encontrada.");

        var pilotAwards = await _uow.PilotAwards.GetByAwardAsync(id);
        foreach (var pa in pilotAwards)
            _uow.PilotAwards.Remove(pa);

        _uow.Awards.Remove(award);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok($"Award \"{award.Nome}\" excluída.");
    }

    public async Task<Award> ObterOuCriarPatenteAsync(int rankId, string nome)
    {
        var todas = await _uow.Awards.GetAllAsync();
        var existente = todas.FirstOrDefault(a => a.Origem == AwardOrigem.Patente && a.RankId == rankId);
        if (existente is not null) return existente;

        var award = new Award { Nome = nome, Origem = AwardOrigem.Patente, RankId = rankId };
        await _uow.Awards.AddAsync(award);
        await _uow.SaveChangesAsync();
        return award;
    }

    public async Task<Award> ObterOuCriarStaffAsync()
    {
        var todas = await _uow.Awards.GetAllAsync();
        var existente = todas.FirstOrDefault(a => a.Origem == AwardOrigem.Staff);
        if (existente is not null) return existente;

        var award = new Award { Nome = "Staff", Origem = AwardOrigem.Staff };
        await _uow.Awards.AddAsync(award);
        await _uow.SaveChangesAsync();
        return award;
    }

    private static AwardDto MapToDto(Award award) => new(award.Id, award.Nome, award.Descricao, award.ImagemUrl);
}