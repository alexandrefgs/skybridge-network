namespace SkyBridge.Application.DTOs;

public record NovoPirepDto(int FlightRouteId, int AircraftId, double HorasDeVoo, int TaxaDescidaTouchdownFpm, string Rede = "Nenhuma");

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
    string Rota,
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
    double HorasDeVoo,
    int TaxaDescidaTouchdownFpm,
    string QualidadePouso,
    long PontosGanhos,
    double ImpactoNoRating,
    string Status,
    string Rede,
    DateTime DataVoo,
    string? Observacoes);