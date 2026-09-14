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
        .Select(a => new AeronaveDto(a.Id, a.Modelo, a.CodigoIcao, a.TiposOperacaoSuportados.Select(t => t.ToString()).ToList()))
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

        return Result<AeronaveDto>.Ok(new AeronaveDto(aircraft.Id, aircraft.Modelo, aircraft.CodigoIcao, aircraft.TiposOperacaoSuportados.Select(t => t.ToString()).ToList()));
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

    public async Task<Result<AirlineDto>> AtualizarAsync(int id, NovaAirlineDto dto)
    {
        var airline = await _uow.Airlines.GetByIdAsync(id);
        if (airline is null) return Result<AirlineDto>.Falha("Companhia não encontrada.");

        airline.Nome = dto.Nome;
        airline.IATA = dto.IATA;
        airline.ICAO = dto.ICAO;
        airline.Pais = dto.Pais;
        airline.CallsignPadrao = dto.CallsignPadrao;

        _uow.Airlines.Update(airline);
        await _uow.SaveChangesAsync();

        return Result<AirlineDto>.Ok(new AirlineDto(airline.Id, airline.Nome, airline.IATA, airline.ICAO, airline.Pais, airline.CallsignPadrao));
    }

    public async Task<Result<string>> ExcluirAsync(int id)
    {
        var airline = await _uow.Airlines.GetWithDetailsAsync(id);
        if (airline is null) return Result<string>.Falha("Companhia não encontrada.");

        if (airline.Frota.Count > 0 || airline.Rotas.Count > 0)
            return Result<string>.Falha("Não é possível excluir: essa companhia tem aeronaves ou rotas cadastradas. Remova-as primeiro.");

        _uow.Airlines.Remove(airline);
        await _uow.SaveChangesAsync();

        return Result<string>.Ok($"Companhia {airline.Nome} excluída.");
    }

    public async Task<Result<FlightRouteDto>> AtualizarRotaAsync(int airlineId, int routeId, NovaRotaDto dto)
    {
        var rota = await _uow.FlightRoutes.GetByIdAsync(routeId);
        if (rota is null || rota.AirlineId != airlineId)
            return Result<FlightRouteDto>.Falha("Rota não encontrada.");

        if (!Enum.TryParse<OperationType>(dto.TipoOperacao, out var tipoOperacao))
            return Result<FlightRouteDto>.Falha($"Tipo de operação inválido: {dto.TipoOperacao}");

        rota.AeroportoOrigem = dto.AeroportoOrigem;
        rota.AeroportoDestino = dto.AeroportoDestino;
        rota.DistanciaMilhas = dto.DistanciaMilhas;
        rota.NumeroVoo = dto.NumeroVoo;
        rota.TipoOperacao = tipoOperacao;
        rota.RatingMinimo = dto.RatingMinimo;

        _uow.FlightRoutes.Update(rota);
        await _uow.SaveChangesAsync();

        return Result<FlightRouteDto>.Ok(new FlightRouteDto(
            rota.Id, rota.AeroportoOrigem, rota.AeroportoDestino, rota.DistanciaMilhas,
            rota.NumeroVoo, rota.TipoOperacao.ToString(), rota.RatingMinimo));
    }

    public async Task<Result<string>> ExcluirRotaAsync(int airlineId, int routeId)
    {
        var rota = await _uow.FlightRoutes.GetByIdAsync(routeId);
        if (rota is null || rota.AirlineId != airlineId)
            return Result<string>.Falha("Rota não encontrada.");

        try
        {
            _uow.FlightRoutes.Remove(rota);
            await _uow.SaveChangesAsync();
        }
        catch (Exception)
        {
            return Result<string>.Falha("Não é possível excluir: essa rota já tem PIREPs ou reservas registradas.");
        }

        return Result<string>.Ok("Rota excluída.");
    }
}