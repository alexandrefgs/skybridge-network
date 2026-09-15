using SkyBridge.Application.Common;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Application.Services;

public class AirportService : IAirportService
{
    private readonly IUnitOfWork _uow;
    public AirportService(IUnitOfWork uow) => _uow = uow;

    public async Task<IReadOnlyList<AirportDto>> ListarAsync()
    {
        var aeroportos = await _uow.Airports.GetAllAsync();
        return aeroportos.Select(MapToDto).ToList();
    }

    public async Task<AirportDto?> ObterPorIcaoAsync(string icao)
    {
        var aeroporto = await _uow.Airports.GetByIcaoAsync(icao.ToUpperInvariant());
        return aeroporto is null ? null : MapToDto(aeroporto);
    }

    public async Task<Result<AirportDto>> CriarAsync(NovoAirportDto dto)
    {
        var icao = dto.Icao.Trim().ToUpperInvariant();
        var existente = await _uow.Airports.GetByIcaoAsync(icao);
        if (existente is not null)
            return Result<AirportDto>.Falha($"Já existe um aeroporto cadastrado com ICAO {icao}.");

        var aeroporto = new Airport
        {
            Icao = icao,
            Iata = string.IsNullOrWhiteSpace(dto.Iata) ? null : dto.Iata.Trim().ToUpperInvariant(),
            Nome = dto.Nome,
            Cidade = dto.Cidade,
            Pais = dto.Pais,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
        };

        await _uow.Airports.AddAsync(aeroporto);
        await _uow.SaveChangesAsync();

        return Result<AirportDto>.Ok(MapToDto(aeroporto));
    }

    private static AirportDto MapToDto(Airport a) => new(a.Id, a.Icao, a.Iata, a.Nome, a.Cidade, a.Pais, a.Latitude, a.Longitude);
}