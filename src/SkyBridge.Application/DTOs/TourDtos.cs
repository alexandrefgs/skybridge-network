namespace SkyBridge.Application.DTOs;

public record NovaEtapaTourDto(int FlightRouteId, int Ordem);

public record NovoTourDto(string Nome, string? Descricao, long PontosBonusConclusao, int? AwardId, List<NovaEtapaTourDto> Etapas);

public record DefinirFotoDto(string Url);

public record EtapaTourDto(int Ordem, int FlightRouteId, int AirlineId, string AirlineNome, string AeroportoOrigem, string AeroportoDestino, string NumeroVoo);

public record TourDto(
    int Id,
    string Nome,
    string? Descricao,
    string? FotoUrl,
    string? FotoCapaUrl,
    long PontosBonusConclusao,
    string? AwardNome,
    IReadOnlyList<EtapaTourDto> Etapas);

public record TourProgressoDto(int TourId, string TourNome, int EtapasCompletas, int TotalEtapas, bool Concluido);