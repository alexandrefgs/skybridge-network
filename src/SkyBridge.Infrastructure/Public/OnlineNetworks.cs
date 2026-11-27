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
        var vatsim = ReadAsync(Vatsim, "v3/vatsim-data.json", NetworkFeedParser.VatsimPilotIds, cancellationToken);
        var ivao = ReadAsync(Ivao, "v2/tracker/whazzup", NetworkFeedParser.IvaoPilotIds, cancellationToken);
        return new OnlinePilots(await vatsim, await ivao);
    }

    private async Task<IReadOnlySet<int>?> ReadAsync(string network, string path, Func<string, IReadOnlySet<int>?> parse, CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(network, out IReadOnlySet<int>? cached))
            return cached;

        IReadOnlySet<int>? ids = null;
        try
        {
            var json = await http.CreateClient(network).GetStringAsync(path, cancellationToken);
            ids = parse(json);
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            logger.LogWarning("Could not read the {Network} feed: {Message}", network, exception.Message);
        }

        cache.Set(network, ids, CacheFor);
        return ids;
    }
}