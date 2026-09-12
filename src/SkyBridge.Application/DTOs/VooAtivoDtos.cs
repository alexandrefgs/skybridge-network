namespace SkyBridge.Application.DTOs;

public record TelemetriaDto(double Latitude, double Longitude, double AltitudePes, double VelocidadeNos, double Heading);

public record VooAtivoDto(int PilotId, string Callsign, double Latitude, double Longitude, double AltitudePes, double VelocidadeNos, double Heading, DateTime AtualizadoEm);