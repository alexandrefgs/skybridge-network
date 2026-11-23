namespace SkyBridge.Application.Airports;

public interface IRunwayImporter
{
    Task<RunwayImportResult> ImportAsync(Stream csv, CancellationToken cancellationToken);
}