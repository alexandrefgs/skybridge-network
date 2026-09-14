namespace SkyBridge.Domain.Interfaces;

public record SimBriefDispatchParametros(
    string Airline,
    string NumeroVoo,
    string TipoAeronaveIcao,
    string Origem,
    string Destino,
    DateOnly Data,
    int HoraPartida,
    int MinutoPartida,
    string? Registro,
    string? Callsign,
    int? Passageiros,
    string StaticId,
    string? Alternado
);

public record SimBriefOfpResumo(
    bool Encontrado,
    string? OrigemIcao,
    string? DestinoIcao,
    double? BlockFuelKg,
    double? TripFuelKg,
    double? DistanciaMn,
    string? RotaTexto
);

public interface ISimBriefClient
{
    string MontarUrlDispatch(SimBriefDispatchParametros parametros);
    Task<SimBriefOfpResumo> BuscarOfpPorStaticIdAsync(string username, string staticId);
}