namespace SkyBridge.Application.Airlines;

public sealed record RplDownload(DateOnly Edition, Stream Content);

public interface IRplSource
{
    Task<RplDownload?> DownloadAsync(string airlineIcao, CancellationToken cancellationToken);
}