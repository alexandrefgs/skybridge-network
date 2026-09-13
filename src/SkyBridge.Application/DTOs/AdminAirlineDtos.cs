namespace SkyBridge.Application.DTOs;

public record NovaAirlineDto(string Nome, string IATA, string ICAO, string Pais, string CallsignPadrao);

public record NovaAeronaveDto(string Modelo, string CodigoIcao, string Matricula, List<string> TiposOperacaoSuportados);

public record NovaRotaDto(string AeroportoOrigem, string AeroportoDestino, int DistanciaMilhas, string NumeroVoo, string TipoOperacao, double RatingMinimo);