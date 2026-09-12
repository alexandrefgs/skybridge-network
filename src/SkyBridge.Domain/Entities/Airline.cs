namespace SkyBridge.Domain.Entities;

public class Airline
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string IATA { get; set; } = string.Empty;
    public string ICAO { get; set; } = string.Empty;
    public string Pais { get; set; } = string.Empty;
    public string CallsignPadrao { get; set; } = string.Empty;

    public ICollection<Aircraft> Frota { get; set; } = new List<Aircraft>();
    public ICollection<FlightRoute> Rotas { get; set; } = new List<FlightRoute>();
    public ICollection<Rank> Ranks { get; set; } = new List<Rank>();
    public ICollection<PilotCareer> Carreiras { get; set; } = new List<PilotCareer>();
}