using SkyBridge.Domain.Entities;

namespace SkyBridge.Domain.Interfaces;

public interface IVooAtivoStore
{
    void Atualizar(VooAtivo voo);
    void Remover(int pilotId);
    IReadOnlyList<VooAtivo> ListarAtivos();
}