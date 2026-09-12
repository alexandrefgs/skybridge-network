namespace SkyBridge.Domain.Entities;

public class Pilot
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Callsign { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    public double Rating { get; set; } = 3.0;
    public long PontosTotais { get; set; } = 0;

    public ICollection<PilotCareer> Carreiras { get; set; } = new List<PilotCareer>();
    public ICollection<Pirep> Pireps { get; set; } = new List<Pirep>();
    public ICollection<TourProgress> ToursEmAndamento { get; set; } = new List<TourProgress>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<PilotAward> Awards { get; set; } = new List<PilotAward>();

    public void AjustarRating(double impacto) => Rating = Math.Clamp(Rating + impacto, 0, 5);
    public void AdicionarPontos(long pontos) => PontosTotais += pontos;
}