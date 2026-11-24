namespace SkyBridge.Application.FlightPlans;

public interface ISimBriefClient
{
    Task<SimBriefResult> FetchLatestAsync(string pilotId, CancellationToken cancellationToken);
}