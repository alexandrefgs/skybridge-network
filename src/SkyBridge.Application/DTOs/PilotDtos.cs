namespace SkyBridge.Application.DTOs;

public record NovoPilotoDto(string Nome, string Callsign, string Email);

public record PilotoResumoDto(int Id, string Nome, string Callsign, double Rating, long PontosTotais, string? LocalizacaoAtualIcao, bool Ativo, string Email);

public record CarreiraDto(int AirlineId, string AirlineNome, double HorasVoadas, string RankAtual);

public record AwardConquistadoDto(string Nome, string? Descricao, string? ImagemUrl, DateTime DataConquista, string Origem);

public record PilotoDetalheDto(
    int Id,
    string Nome,
    string Callsign,
    double Rating,
    long PontosTotais,
    string? LocalizacaoAtualIcao,
    IReadOnlyList<CarreiraDto> Carreiras,
    IReadOnlyList<AwardConquistadoDto> Awards);

public record EstatisticasRedeDto(
    int TotalPilotos,
    int TotalVoosAprovados,
    double TotalMilhasVoadas,
    int TotalTours,
    int PirepsPendentes);