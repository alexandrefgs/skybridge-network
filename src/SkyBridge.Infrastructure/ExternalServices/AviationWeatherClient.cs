using System.Text.Json;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Infrastructure.ExternalServices;

public class AviationWeatherClient : IWeatherClient
{
    private readonly HttpClient _http;

    public AviationWeatherClient(HttpClient http) => _http = http;

    public async Task<MetarDto?> ObterMetarAsync(string icao)
    {
        var url = $"https://aviationweather.gov/api/data/metar?ids={Uri.EscapeDataString(icao)}&format=json";
        var resposta = await _http.GetAsync(url);
        if (!resposta.IsSuccessStatusCode) return null;

        using var stream = await resposta.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);

        if (doc.RootElement.ValueKind != JsonValueKind.Array || doc.RootElement.GetArrayLength() == 0)
            return null;

        var item = doc.RootElement[0];

        string raw = item.TryGetProperty("rawOb", out var rawEl) ? rawEl.GetString() ?? "" : "";
        double? temp = item.TryGetProperty("temp", out var tempEl) && tempEl.ValueKind == JsonValueKind.Number ? tempEl.GetDouble() : null;
        double? qnh = item.TryGetProperty("altim", out var altimEl) && altimEl.ValueKind == JsonValueKind.Number ? altimEl.GetDouble() : null;
        int? ventoDir = item.TryGetProperty("wdir", out var wdirEl) && wdirEl.ValueKind == JsonValueKind.Number ? wdirEl.GetInt32() : null;
        int? ventoVel = item.TryGetProperty("wspd", out var wspdEl) && wspdEl.ValueKind == JsonValueKind.Number ? wspdEl.GetInt32() : null;
        double? lat = item.TryGetProperty("lat", out var latEl) && latEl.ValueKind == JsonValueKind.Number ? latEl.GetDouble() : null;
        double? lon = item.TryGetProperty("lon", out var lonEl) && lonEl.ValueKind == JsonValueKind.Number ? lonEl.GetDouble() : null;

        return new MetarDto(icao.ToUpperInvariant(), raw, temp, qnh, ventoDir, ventoVel, lat, lon);
    }

    public async Task<TafDto?> ObterTafAsync(string icao)
    {
        var url = $"https://aviationweather.gov/api/data/taf?ids={Uri.EscapeDataString(icao)}&format=json";
        var resposta = await _http.GetAsync(url);
        if (!resposta.IsSuccessStatusCode) return null;

        using var stream = await resposta.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);

        if (doc.RootElement.ValueKind != JsonValueKind.Array || doc.RootElement.GetArrayLength() == 0)
            return null;

        var item = doc.RootElement[0];
        string raw = item.TryGetProperty("rawTAF", out var rawEl) ? rawEl.GetString() ?? "" : "";

        if (string.IsNullOrWhiteSpace(raw)) return null;

        return new TafDto(icao.ToUpperInvariant(), raw);
    }
}