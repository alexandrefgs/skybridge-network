namespace SkyBridge.Domain.Entities;

public class RefreshToken
{
    public int Id { get; set; }

    public int PilotId { get; set; }
    public Pilot? Pilot { get; set; }

    public string TokenHash { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime ExpiraEm { get; set; }
    public DateTime? RevogadoEm { get; set; }

    public bool EstaAtivo => RevogadoEm is null && DateTime.UtcNow < ExpiraEm;

    public void Revogar() => RevogadoEm = DateTime.UtcNow;
}