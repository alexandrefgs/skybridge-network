namespace SkyBridge.Application.DTOs;

public record NovoAirportDto(string Icao, string? Iata, string Nome, string Cidade, string Pais, double Latitude, double Longitude);

public record AirportDto(int Id, string Icao, string? Iata, string Nome, string Cidade, string Pais, double Latitude, double Longitude);