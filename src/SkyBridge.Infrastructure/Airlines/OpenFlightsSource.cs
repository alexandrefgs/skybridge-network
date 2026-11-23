using SkyBridge.Application.Airlines;

namespace SkyBridge.Infrastructure.Airlines;

internal sealed class OpenFlightsSource(HttpClient http) : IAirlineSource
{
    public Task<Stream> OpenAirlinesAsync(CancellationToken cancellationToken) =>
        http.GetStreamAsync("airlines.dat", cancellationToken);

    public Task<Stream> OpenRoutesAsync(CancellationToken cancellationToken) =>
        http.GetStreamAsync("routes.dat", cancellationToken);
}