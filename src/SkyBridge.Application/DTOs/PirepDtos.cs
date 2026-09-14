namespace SkyBridge.Application.DTOs;

public record NovoPirepDto(int FlightRouteId, int AircraftId, double HorasDeVoo, int TaxaDescidaTouchdownFpm, string Rede = "Nenhuma", int? BookingId = null);

public record PirepResultDto(
    int Id,
    string QualidadePouso,
    long PontosGanhos,
    string Status,
    double RatingAtualizado,
    long PontosTotaisAtualizados,
    string? NovaPatente);

public record PirepPendenteDto(
    int Id,
    string PilotCallsign,
    string PilotNome,
    string VooCallsign,
    string AeroportoOrigem,
    string AeroportoDestino,
    string AeronaveModelo,
    double DistanciaMilhas,
    int TaxaDescidaTouchdownFpm,
    DateTime DataVoo);

public record UltimoVooDto(
    int PirepId,
    string PilotCallsign,
    string PilotNome,
    string VooCallsign,
    string AeroportoOrigem,
    string AeroportoDestino,
    double HorasDeVoo,
    string AeronaveModelo,
    string Rede,
    string Status,
    DateTime DataVoo,
    string CompanhiaNome);

public record PirepDetalheDto(
    int Id,
    string PilotCallsign,
    string PilotNome,
    string VooCallsign,
    string AeroportoOrigem,
    string AeroportoDestino,
    string AeronaveModelo,
    string AeronaveCodigoIcao,
    double HorasDeVoo,
    int TaxaDescidaTouchdownFpm,
    string QualidadePouso,
    long PontosGanhos,
    double ImpactoNoRating,
    string Status,
    string Rede,
    DateTime DataVoo,
    string? Observacoes);

public record TelemetriaLogDto(
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
    string? Squawk,
    string? FrequenciaComAtiva,
    string? AeronaveNome,
    DateTime RegistradoEmUtc);