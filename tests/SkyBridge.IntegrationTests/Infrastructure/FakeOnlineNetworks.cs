using System.Collections.Concurrent;
using SkyBridge.Application.Public;

namespace SkyBridge.IntegrationTests.Infrastructure;

public sealed class FakeOnlineNetworks : IOnlineNetworks
{
    public static readonly ConcurrentDictionary<int, byte> Vatsim = new();
    public static readonly ConcurrentDictionary<int, byte> Ivao = new();
    public static bool IvaoDown { get; set; }

    public Task<OnlinePilots> GetOnlinePilotsAsync(CancellationToken cancellationToken) =>
        Task.FromResult(new OnlinePilots(Vatsim.Keys.ToHashSet(), IvaoDown ? null : Ivao.Keys.ToHashSet()));
}