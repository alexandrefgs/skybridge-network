using SkyBridge.Domain.Enums;

namespace SkyBridge.Domain.Entities;

public class FlightRoute
{
    public int Id { get; set; }
    public string AeroportoOrigem { get; set; } = string.Empty;
    public string AeroportoDestino { get; set; } = string.Empty;
    public int DistanciaMilhas { get; set; }
    public string NumeroVoo { get; set; } = string.Empty;

    public OperationType TipoOperacao { get; set; }
    public double RatingMinimo { get; set; } = 0;
    public int? RankMinimoId { get; set; }

    public int AirlineId { get; set; }
    public Airline? Airline { get; set; }

    public ICollection<Pirep> Pireps { get; set; } = new List<Pirep>();
}