using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class AirlineService : IAirlineService
{
    private readonly IUnitOfWork _uow;
    public AirlineService(IUnitOfWork uow) => _uow = uow;

    public async Task<IReadOnlyList<AirlineDto>> ListarAsync()
    {
        var airlines = await _uow.Airlines.GetAllAsync();
        return airlines
            .Select(a => new AirlineDto(a.Id, a.Nome, a.IATA, a.ICAO, a.Pais, a.CallsignPadrao))
            .ToList();
    }

    public Task<Airline?> ObterDetalheAsync(int id) => _uow.Airlines.GetWithDetailsAsync(id);

    public async Task<IReadOnlyList<FlightRouteDto>> ListarRotasAsync(int airlineId)
    {
        var rotas = await _uow.FlightRoutes.GetByAirlineAsync(airlineId);
        return rotas
            .Select(r => new FlightRouteDto(
                r.Id, r.AeroportoOrigem, r.AeroportoDestino, r.DistanciaMilhas,
                r.NumeroVoo, r.TipoOperacao.ToString(), r.RatingMinimo))
            .ToList();
    }
}