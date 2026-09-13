namespace SkyBridge.Application.DTOs;

public record AirlineDto(int Id, string Nome, string IATA, string ICAO, string Pais, string CallsignPadrao);

public record AeronaveDto(int Id, string Modelo, string CodigoIcao);

public record AirlineDetalheDto(int Id, string Nome, string IATA, string ICAO, string Pais, string CallsignPadrao, IReadOnlyList<AeronaveDto> Frota);

public record FlightRouteDto(
    int Id,
    string AeroportoOrigem,
    string AeroportoDestino,
    int DistanciaMilhas,
    string NumeroVoo,
    string TipoOperacao,
    double RatingMinimo);