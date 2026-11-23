using SkyBridge.Application.Airports;

namespace SkyBridge.Infrastructure.Airports;

internal sealed class OurAirportsSource(HttpClient http) : IAirportSource
{
    public Task<Stream> OpenAirportsCsvAsync(CancellationToken cancellationToken) =>
        http.GetStreamAsync("airports.csv", cancellationToken);

    public Task<Stream> OpenRunwaysCsvAsync(CancellationToken cancellationToken) =>
        http.GetStreamAsync("runways.csv", cancellationToken);
}