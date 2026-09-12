using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
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

    private static AwardDto MapToDto(Award award) => new(award.Id, award.Nome, award.Descricao, award.ImagemUrl);
}