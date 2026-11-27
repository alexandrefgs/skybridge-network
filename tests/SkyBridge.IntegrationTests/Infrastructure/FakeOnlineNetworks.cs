using System.Collections.Concurrent;
using SkyBridge.Application.Public;

namespace SkyBridge.IntegrationTests.Infrastructure;

public sealed class FakeOnlineNetworks : IOnlineNetworks
{
    public static readonly ConcurrentDictionary<int, NetworkPilot> Vatsim = new();
    public static readonly ConcurrentDictionary<int, NetworkPilot> Ivao = new();
    public static bool IvaoDown { get; set; }

    public static NetworkPilot Pilot(int id, string callsign = "SKB100", double? latitude = -25.6, double? longitude = -48.5,
        string? departure = null, string? arrival = null, string? aircraft = null) =>
        new(id, callsign, latitude, longitude, 34000, 440, 210, departure, arrival, aircraft);

    public Task<OnlinePilots> GetOnlinePilotsAsync(CancellationToken cancellationToken) =>
        Task.FromResult(new OnlinePilots(
            new Dictionary<int, NetworkPilot>(Vatsim),
            IvaoDown ? null : new Dictionary<int, NetworkPilot>(Ivao)));
}