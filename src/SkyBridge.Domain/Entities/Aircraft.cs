using SkyBridge.Domain.Enums;

namespace SkyBridge.Domain.Entities;

public class Aircraft
{
    public int Id { get; set; }
    public string Modelo { get; set; } = string.Empty;
    public string Matricula { get; set; } = string.Empty;

    public int AirlineId { get; set; }
    public Airline? Airline { get; set; }

    public List<OperationType> TiposOperacaoSuportados { get; set; } = new();
}