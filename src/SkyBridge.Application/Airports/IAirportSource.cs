namespace SkyBridge.Application.Airports;

public interface IAirportSource
{
    Task<Stream> OpenAirportsCsvAsync(CancellationToken cancellationToken);
    Task<Stream> OpenRunwaysCsvAsync(CancellationToken cancellationToken);
}