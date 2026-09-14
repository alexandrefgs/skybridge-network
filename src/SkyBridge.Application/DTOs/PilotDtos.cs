namespace SkyBridge.Application.DTOs;

public record NovoPilotoDto(string Nome, string Callsign, string Email);

public record PilotoResumoDto(int Id, string Nome, string Callsign, double Rating, long PontosTotais, string? LocalizacaoAtualIcao);

public record CarreiraDto(int AirlineId, string AirlineNome, double HorasVoadas, string RankAtual);

public record AwardConquistadoDto(string Nome, string? Descricao, string? ImagemUrl, DateTime DataConquista);

public record PilotoDetalheDto(
    int Id,
    string Nome,
    string Callsign,
    double Rating,
    long PontosTotais,
    string? LocalizacaoAtualIcao,
    IReadOnlyList<CarreiraDto> Carreiras,
    IReadOnlyList<AwardConquistadoDto> Awards);