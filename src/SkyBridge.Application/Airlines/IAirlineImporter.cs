namespace SkyBridge.Application.Airlines;

public interface IAirlineImporter
{
    Task<AirlineImportResult> ImportAsync(Stream airlines, Stream routes, CancellationToken cancellationToken);
}