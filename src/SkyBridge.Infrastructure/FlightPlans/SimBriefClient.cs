using System.Net;
using SkyBridge.Application.FlightPlans;

namespace SkyBridge.Infrastructure.FlightPlans;

internal sealed class SimBriefClient(HttpClient http) : ISimBriefClient
{
    public async Task<SimBriefResult> FetchLatestAsync(string pilotId, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await http.GetAsync(
                $"api/xml.fetcher.php?userid={Uri.EscapeDataString(pilotId)}&client=skybridge-network", cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.BadRequest)
                return SimBriefOfpParser.Parse(body);

            return SimBriefResult.Fail($"SimBrief is not answering right now ({(int)response.StatusCode}). Try again in a moment.");
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            return SimBriefResult.Fail("Could not reach SimBrief. Try again in a moment.");
        }
    }
}