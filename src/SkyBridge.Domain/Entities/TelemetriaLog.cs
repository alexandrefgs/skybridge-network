namespace SkyBridge.Domain.Entities;

public class TelemetriaLog
{
    public int Id { get; set; }

    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double AltitudePes { get; set; }
    public double VelocidadeNos { get; set; }
    public double Heading { get; set; }
    public bool EstaNoSolo { get; set; }
    public double VelocidadeVerticalFpm { get; set; }

    public double Pitch { get; set; }
    public double Bank { get; set; }
    public double FlapsPercentual { get; set; }
    public bool SpoilersArmado { get; set; }
    public double SpoilersPercentual { get; set; }
    public double TrainPousoPercentual { get; set; }
    public string? Squawk { get; set; }
    public string? FrequenciaComAtiva { get; set; }
    public string? AeronaveNome { get; set; }

    public DateTime RegistradoEmUtc { get; set; } = DateTime.UtcNow;
}