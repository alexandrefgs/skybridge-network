namespace SkyBridge.Domain.Entities;

public class PilotCareer
{
    public int Id { get; set; }

    public int PilotId { get; set; }
    public Pilot? Pilot { get; set; }

    public int AirlineId { get; set; }
    public Airline? Airline { get; set; }

    public double HorasVoadas { get; set; } = 0;

    public int RankAtualId { get; set; }
    public Rank? RankAtual { get; set; }

    public void RegistrarHoras(double horas) => HorasVoadas += horas;
}