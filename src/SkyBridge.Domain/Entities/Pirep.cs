using SkyBridge.Domain.Enums;

namespace SkyBridge.Domain.Entities;

public class Pirep
{
    public int Id { get; set; }

    public int PilotId { get; set; }
    public Pilot? Pilot { get; set; }

    public int FlightRouteId { get; set; }
    public FlightRoute? FlightRoute { get; set; }

    public int AircraftId { get; set; }
    public Aircraft? Aircraft { get; set; }

    public DateTime DataVoo { get; set; } = DateTime.UtcNow;
    public double HorasDeVoo { get; set; }

    public int TaxaDescidaTouchdownFpm { get; set; }
    public LandingQuality QualidadePouso { get; set; }
    public RedeOnline Rede { get; set; } = RedeOnline.Nenhuma;

    public long PontosGanhos { get; set; }
    public double ImpactoNoRating { get; set; }

    public PirepStatus Status { get; set; } = PirepStatus.PendenteAprovacao;
    public string? Observacoes { get; set; }
    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }
}