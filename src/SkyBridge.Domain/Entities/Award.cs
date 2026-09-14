using SkyBridge.Domain.Enums;

namespace SkyBridge.Domain.Entities;

public class Award
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string? ImagemUrl { get; set; }
    public AwardOrigem Origem { get; set; } = AwardOrigem.Tour;
    public int? RankId { get; set; }
    public Rank? Rank { get; set; }
}

public class PilotAward
{
    public int Id { get; set; }

    public int PilotId { get; set; }
    public Pilot? Pilot { get; set; }

    public int AwardId { get; set; }
    public Award? Award { get; set; }

    public DateTime DataConquista { get; set; } = DateTime.UtcNow;
}