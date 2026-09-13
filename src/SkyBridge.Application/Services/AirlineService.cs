using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Enums;
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

    public async Task<AirlineDetalheDto?> ObterDetalheAsync(int id)
    {
        var airline = await _uow.Airlines.GetWithDetailsAsync(id);
        if (airline is null) return null;

        var frota = airline.Frota
            .Select(a => new AeronaveDto(a.Id, a.Modelo, a.CodigoIcao))
            .ToList();

        return new AirlineDetalheDto(airline.Id, airline.Nome, airline.IATA, airline.ICAO, airline.Pais, airline.CallsignPadrao, frota);
    }

    public async Task<IReadOnlyList<FlightRouteDto>> ListarRotasAsync(int airlineId)
    {
        var rotas = await _uow.FlightRoutes.GetByAirlineAsync(airlineId);
        return rotas
            .Select(r => new FlightRouteDto(
                r.Id, r.AeroportoOrigem, r.AeroportoDestino, r.DistanciaMilhas,
                r.NumeroVoo, r.TipoOperacao.ToString(), r.RatingMinimo))
            .ToList();
    }

    public async Task<AirlineDto> CriarAsync(NovaAirlineDto dto)
    {
        var airline = new Airline
        {
            Nome = dto.Nome,
            IATA = dto.IATA,
            ICAO = dto.ICAO,
            Pais = dto.Pais,
            CallsignPadrao = dto.CallsignPadrao
        };

        await _uow.Airlines.AddAsync(airline);
        await _uow.SaveChangesAsync();

        return new AirlineDto(airline.Id, airline.Nome, airline.IATA, airline.ICAO, airline.Pais, airline.CallsignPadrao);
    }

    public async Task<Result<AeronaveDto>> AdicionarAeronaveAsync(int airlineId, NovaAeronaveDto dto)
    {
        var airline = await _uow.Airlines.GetByIdAsync(airlineId);
        if (airline is null) return Result<AeronaveDto>.Falha("Companhia não encontrada.");

        var tipos = new List<OperationType>();
        foreach (var tipo in dto.TiposOperacaoSuportados)
        {
            if (!Enum.TryParse<OperationType>(tipo, out var parsed))
                return Result<AeronaveDto>.Falha($"Tipo de operação inválido: {tipo}");
            tipos.Add(parsed);
        }

        var aircraft = new Aircraft
        {
            AirlineId = airlineId,
            Modelo = dto.Modelo,
            CodigoIcao = dto.CodigoIcao,
            Matricula = dto.Matricula,
            TiposOperacaoSuportados = tipos
        };

        await _uow.Aircrafts.AddAsync(aircraft);
        await _uow.SaveChangesAsync();

        return Result<AeronaveDto>.Ok(new AeronaveDto(aircraft.Id, aircraft.Modelo, aircraft.CodigoIcao));
    }

    public async Task<Result<FlightRouteDto>> AdicionarRotaAsync(int airlineId, NovaRotaDto dto)
    {
        var airline = await _uow.Airlines.GetByIdAsync(airlineId);
        if (airline is null) return Result<FlightRouteDto>.Falha("Companhia não encontrada.");

        if (!Enum.TryParse<OperationType>(dto.TipoOperacao, out var tipoOperacao))
            return Result<FlightRouteDto>.Falha($"Tipo de operação inválido: {dto.TipoOperacao}");

        var rota = new FlightRoute
        {
            AirlineId = airlineId,
            AeroportoOrigem = dto.AeroportoOrigem,
            AeroportoDestino = dto.AeroportoDestino,
            DistanciaMilhas = dto.DistanciaMilhas,
            NumeroVoo = dto.NumeroVoo,
            TipoOperacao = tipoOperacao,
            RatingMinimo = dto.RatingMinimo
        };

        await _uow.FlightRoutes.AddAsync(rota);
        await _uow.SaveChangesAsync();

        return Result<FlightRouteDto>.Ok(new FlightRouteDto(
            rota.Id, rota.AeroportoOrigem, rota.AeroportoDestino, rota.DistanciaMilhas,
            rota.NumeroVoo, rota.TipoOperacao.ToString(), rota.RatingMinimo));
    }
}