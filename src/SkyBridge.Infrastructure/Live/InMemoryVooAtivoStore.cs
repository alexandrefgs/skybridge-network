using System.Collections.Concurrent;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Infrastructure.Live;

public class InMemoryVooAtivoStore : IVooAtivoStore
{
    private static readonly TimeSpan TempoParaConsiderarInativo = TimeSpan.FromSeconds(30);
    private readonly ConcurrentDictionary<int, VooAtivo> _voos = new();

    public void Atualizar(VooAtivo voo) => _voos[voo.PilotId] = voo;

    public void Remover(int pilotId) => _voos.TryRemove(pilotId, out _);

    public IReadOnlyList<VooAtivo> ListarAtivos()
    {
        var agora = DateTime.UtcNow;
        var ativos = new List<VooAtivo>();

        foreach (var voo in _voos.Values)
        {
            if (agora - voo.AtualizadoEm > TempoParaConsiderarInativo)
            {
                _voos.TryRemove(voo.PilotId, out _);
                continue;
            }

            ativos.Add(voo);
        }

        return ativos;
    }
}