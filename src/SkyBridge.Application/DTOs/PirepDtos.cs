namespace SkyBridge.Application.DTOs;

public record NovoPirepDto(int PilotId, int FlightRouteId, int AircraftId, double HorasDeVoo, int TaxaDescidaTouchdownFpm);

public record PirepResultDto(
    int Id,
    string QualidadePouso,
    long PontosGanhos,
    string Status,
    double RatingAtualizado,
    long PontosTotaisAtualizados,
    string? NovaPatente);