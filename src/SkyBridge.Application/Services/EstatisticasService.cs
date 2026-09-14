using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Enums;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class EstatisticasService : IEstatisticasService
{
    private readonly IUnitOfWork _uow;
    public EstatisticasService(IUnitOfWork uow) => _uow = uow;

    public async Task<EstatisticasRedeDto> ObterAsync(bool ehAdmin)
    {
        var pilotos = await _uow.Pilots.GetAllAsync();
        var tours = await _uow.Tours.GetAllAsync();
        var todosPireps = await _uow.Pireps.GetUltimosAsync(int.MaxValue);

        var aprovados = todosPireps.Where(p => p.Status == PirepStatus.Aprovado).ToList();
        var milhasTotais = 0.0;
        foreach (var pirep in aprovados)
        {
            var rota = await _uow.FlightRoutes.GetByIdAsync(pirep.FlightRouteId);
            if (rota is not null) milhasTotais += rota.DistanciaMilhas;
        }

        var pendentes = ehAdmin ? (await _uow.Pireps.GetPendentesAsync()).Count : 0;

        return new EstatisticasRedeDto(
            pilotos.Count,
            aprovados.Count,
            milhasTotais,
            tours.Count,
            pendentes);
    }
}