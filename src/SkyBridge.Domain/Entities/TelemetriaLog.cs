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

    public DateTime RegistradoEmUtc { get; set; } = DateTime.UtcNow;
}