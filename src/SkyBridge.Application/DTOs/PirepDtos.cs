namespace SkyBridge.Application.DTOs;

public record NovoPirepDto(int FlightRouteId, int AircraftId, double HorasDeVoo, int TaxaDescidaTouchdownFpm);

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