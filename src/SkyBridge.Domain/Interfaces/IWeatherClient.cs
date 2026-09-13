namespace SkyBridge.Domain.Interfaces;

public record MetarDto(string Icao, string Raw, double? TemperaturaC, double? QnhHpa, int? VentoDirecao, int? VentoVelocidadeKt);
public record TafDto(string Icao, string Raw);

public interface IWeatherClient
{
    Task<MetarDto?> ObterMetarAsync(string icao);
    Task<TafDto?> ObterTafAsync(string icao);
}