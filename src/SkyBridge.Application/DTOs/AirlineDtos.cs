namespace SkyBridge.Application.DTOs;

public record AirlineDto(int Id, string Nome, string IATA, string ICAO, string Pais, string CallsignPadrao);

public record FlightRouteDto(
    int Id,
    string AeroportoOrigem,
    string AeroportoDestino,
    int DistanciaMilhas,
    string NumeroVoo,
    string TipoOperacao,
    double RatingMinimo);