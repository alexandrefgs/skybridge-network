namespace SkyBridge.Application.Airports;

public interface IAirportImporter
{
    Task<AirportImportResult> ImportAsync(Stream csv, CancellationToken cancellationToken);
}