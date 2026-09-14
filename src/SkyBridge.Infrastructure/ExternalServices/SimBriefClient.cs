using System.Text.Json;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Infrastructure.ExternalServices;

public class SimBriefClient : ISimBriefClient
{
    private readonly HttpClient _http;

    public SimBriefClient(HttpClient http) => _http = http;

    public string MontarUrlDispatch(SimBriefDispatchParametros p)
    {
        var data = p.Data.ToString("ddMMMyy").ToUpperInvariant();

        var query = new List<string>
        {
            $"airline={Uri.EscapeDataString(p.Airline)}",
            $"fltnum={Uri.EscapeDataString(p.NumeroVoo)}",
            $"type={Uri.EscapeDataString(p.TipoAeronaveIcao)}",
            $"orig={Uri.EscapeDataString(p.Origem)}",
            $"dest={Uri.EscapeDataString(p.Destino)}",
            $"date={data}",
            $"deph={p.HoraPartida:00}",
            $"depm={p.MinutoPartida:00}",
            $"static_id={Uri.EscapeDataString(p.StaticId)}"
        };

        if (!string.IsNullOrWhiteSpace(p.Registro))
            query.Add($"reg={Uri.EscapeDataString(p.Registro)}");

        if (!string.IsNullOrWhiteSpace(p.Callsign))
            query.Add($"callsign={Uri.EscapeDataString(p.Callsign)}");

        if (!string.IsNullOrWhiteSpace(p.Alternado))
            query.Add($"altn={Uri.EscapeDataString(p.Alternado)}");

        return $"https://dispatch.simbrief.com/options/custom?{string.Join('&', query)}";
    }

    public async Task<SimBriefOfpResumo> BuscarOfpPorStaticIdAsync(string username, string staticId)
    {
        var url = $"https://www.simbrief.com/api/xml.fetcher.php?username={Uri.EscapeDataString(username)}&static_id={Uri.EscapeDataString(staticId)}&json=v2";

        var resposta = await _http.GetAsync(url);
        if (!resposta.IsSuccessStatusCode)
            return new SimBriefOfpResumo(false, null, null, null, null, null, null);

        using var stream = await resposta.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);
        var raiz = doc.RootElement;

        string? origem = TentarObterTexto(raiz, "origin", "icao_code");
        string? destino = TentarObterTexto(raiz, "destination", "icao_code");
        double? blockFuel = TentarObterNumero(raiz, "fuel", "plan_ramp");
        double? tripFuel = TentarObterNumero(raiz, "fuel", "enroute_burn");
        double? distancia = TentarObterNumero(raiz, "general", "route_distance");
        string? rota = TentarObterTexto(raiz, "general", "route");

        return new SimBriefOfpResumo(true, origem, destino, blockFuel, tripFuel, distancia, rota);
    }

    private static string? TentarObterTexto(JsonElement raiz, string secao, string campo)
    {
        if (raiz.TryGetProperty(secao, out var el) && el.TryGetProperty(campo, out var val))
            return val.GetString();
        return null;
    }

    private static double? TentarObterNumero(JsonElement raiz, string secao, string campo)
    {
        if (raiz.TryGetProperty(secao, out var el) && el.TryGetProperty(campo, out var val))
        {
            if (val.ValueKind == JsonValueKind.String && double.TryParse(val.GetString(), out var d)) return d;
            if (val.ValueKind == JsonValueKind.Number) return val.GetDouble();
        }
        return null;
    }
}