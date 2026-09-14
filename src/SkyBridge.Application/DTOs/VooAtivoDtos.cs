namespace SkyBridge.Application.DTOs;

public record TelemetriaDto(
    double Latitude,
    double Longitude,
    double AltitudePes,
    double VelocidadeNos,
    double Heading,
    bool EstaNoSolo,
    double VelocidadeVerticalFpm,
    double Pitch,
    double Bank,
    double FlapsPercentual,
    bool SpoilersArmado,
    double SpoilersPercentual,
    double TrainPousoPercentual,
    string Squawk,
    string FrequenciaComAtiva,
    string AeronaveNome);
    
public record VooAtivoDto(
    int PilotId,
    string Callsign,
    double Latitude,
    double Longitude,
    double AltitudePes,
    double VelocidadeNos,
    double Heading,
    DateTime AtualizadoEm,
    string? AeronaveModelo,
    string? AeronaveCodigoIcao,
    string? AeroportoOrigem,
    string? AeroportoDestino
);