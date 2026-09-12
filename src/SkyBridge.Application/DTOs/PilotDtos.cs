namespace SkyBridge.Application.DTOs;

public record NovoPilotoDto(string Nome, string Callsign, string Email);

public record PilotoResumoDto(int Id, string Nome, string Callsign, double Rating, long PontosTotais);

public record CarreiraDto(int AirlineId, string AirlineNome, double HorasVoadas, string RankAtual);

public record PilotoDetalheDto(
    int Id,
    string Nome,
    string Callsign,
    double Rating,
    long PontosTotais,
    IReadOnlyList<CarreiraDto> Carreiras);