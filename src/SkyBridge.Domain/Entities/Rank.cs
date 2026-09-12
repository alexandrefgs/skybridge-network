using SkyBridge.Domain.Enums;

namespace SkyBridge.Domain.Entities;

public class Rank
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int Nivel { get; set; }
    public int HorasMinimas { get; set; }
    public double RatingMinimo { get; set; }
    public OperationType EscopoRota { get; set; }

    public int AirlineId { get; set; }
    public Airline? Airline { get; set; }
}