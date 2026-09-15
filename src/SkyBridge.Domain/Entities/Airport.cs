namespace SkyBridge.Domain.Entities;

public class Airport
{
    public int Id { get; set; }
    public string Icao { get; set; } = string.Empty;
    public string? Iata { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Pais { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}