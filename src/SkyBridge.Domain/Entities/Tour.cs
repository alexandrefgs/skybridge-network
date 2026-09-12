namespace SkyBridge.Domain.Entities;

public class Tour
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public long PontosBonusConclusao { get; set; }

    public ICollection<TourStop> Etapas { get; set; } = new List<TourStop>();
}

public class TourStop
{
    public int Id { get; set; }
    public int TourId { get; set; }
    public Tour? Tour { get; set; }

    public int FlightRouteId { get; set; }
    public FlightRoute? FlightRoute { get; set; }

    public int Ordem { get; set; }
}

public class TourProgress
{
    public int Id { get; set; }

    public int PilotId { get; set; }
    public Pilot? Pilot { get; set; }

    public int TourId { get; set; }
    public Tour? Tour { get; set; }

    public int EtapasCompletas { get; set; } = 0;
    public bool Concluido { get; set; } = false;
}