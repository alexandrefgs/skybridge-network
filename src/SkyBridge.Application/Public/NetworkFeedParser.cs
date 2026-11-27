using System.Text.Json;

namespace SkyBridge.Application.Public;

public static class NetworkFeedParser
{
    public static IReadOnlySet<int>? VatsimPilotIds(string json) =>
        Read(json, root => root.TryGetProperty("pilots", out var pilots) ? pilots : null, "cid");

    public static IReadOnlySet<int>? IvaoPilotIds(string json) =>
        Read(json, root => root.TryGetProperty("clients", out var clients) && clients.TryGetProperty("pilots", out var pilots) ? pilots : null, "userId");

    private static IReadOnlySet<int>? Read(string json, Func<JsonElement, JsonElement?> list, string idField)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Object || list(document.RootElement) is not { ValueKind: JsonValueKind.Array } pilots)
                return null;

            var ids = new HashSet<int>();
            foreach (var pilot in pilots.EnumerateArray())
            {
                if (pilot.ValueKind == JsonValueKind.Object && pilot.TryGetProperty(idField, out var id) && TryId(id, out var value))
                    ids.Add(value);
            }
            return ids;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static bool TryId(JsonElement element, out int value)
    {
        value = 0;
        return element.ValueKind switch
        {
            JsonValueKind.Number => element.TryGetInt32(out value),
            JsonValueKind.String => int.TryParse(element.GetString(), out value),
            _ => false
        };
    }
}