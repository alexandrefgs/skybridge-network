using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using SkyBridge.Application.Public;

namespace SkyBridge.Infrastructure.Public;

internal sealed class OnlineNetworks(IHttpClientFactory http, IMemoryCache cache, ILogger<OnlineNetworks> logger) : IOnlineNetworks
{
    public const string Vatsim = "vatsim";
    public const string Ivao = "ivao";
    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(1);

    public async Task<OnlinePilots> GetOnlinePilotsAsync(CancellationToken cancellationToken)
    {
        var vatsim = ReadAsync(Vatsim, "v3/vatsim-data.json", NetworkFeedParser.VatsimPilots, cancellationToken);
        var ivao = ReadAsync(Ivao, "v2/tracker/whazzup", NetworkFeedParser.IvaoPilots, cancellationToken);
        return new OnlinePilots(await vatsim, await ivao);
    }

    private async Task<IReadOnlyDictionary<int, NetworkPilot>?> ReadAsync(
        string network, string path, Func<string, IReadOnlyDictionary<int, NetworkPilot>?> parse, CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(network, out IReadOnlyDictionary<int, NetworkPilot>? cached))
            return cached;

        IReadOnlyDictionary<int, NetworkPilot>? pilots = null;
        try
        {
            var json = await http.CreateClient(network).GetStringAsync(path, cancellationToken);
            pilots = parse(json);
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning("Could not read the {Network} feed: {Message}", network, exception.Message);
        }

        cache.Set(network, pilots, CacheFor);
        return pilots;
    }
}