namespace SkyBridge.Application.Airlines;

public interface IAirlineSource
{
    Task<Stream> OpenAirlinesAsync(CancellationToken cancellationToken);
    Task<Stream> OpenRoutesAsync(CancellationToken cancellationToken);
}