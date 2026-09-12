namespace SkyBridge.Domain.Entities;

public class VooAtivo
{
    public int PilotId { get; set; }
    public string Callsign { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double AltitudePes { get; set; }
    public double VelocidadeNos { get; set; }
    public double Heading { get; set; }
    public DateTime AtualizadoEm { get; set; }
}