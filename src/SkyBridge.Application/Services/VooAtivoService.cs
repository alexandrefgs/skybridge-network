using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class VooAtivoService : IVooAtivoService
{
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
    }

    public Task<IReadOnlyList<VooAtivoDto>> ListarAtivosAsync()
    {
        var ativos = _store.ListarAtivos()
            .Select(v => new VooAtivoDto(v.PilotId, v.Callsign, v.Latitude, v.Longitude, v.AltitudePes, v.VelocidadeNos, v.Heading, v.AtualizadoEm))
            .ToList();

        return Task.FromResult<IReadOnlyList<VooAtivoDto>>(ativos);
    }
}