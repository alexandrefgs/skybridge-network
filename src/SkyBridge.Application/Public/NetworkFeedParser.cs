using System.Text.Json;

namespace SkyBridge.Application.Public;

public static class NetworkFeedParser
{
    public static IReadOnlyDictionary<int, NetworkPilot>? VatsimPilots(string json) =>
        Read(json, root => root.TryGetProperty("pilots", out var pilots) ? pilots : null, VatsimPilot);

    public static IReadOnlyDictionary<int, NetworkPilot>? IvaoPilots(string json) =>
        Read(json, root => root.TryGetProperty("clients", out var clients) && clients.ValueKind == JsonValueKind.Object && clients.TryGetProperty("pilots", out var pilots) ? pilots : null, IvaoPilot);

    private static NetworkPilot? VatsimPilot(JsonElement pilot)
    {
        if (!TryId(Property(pilot, "cid"), out var id))
            return null;

        var plan = Property(pilot, "flight_plan");
        return new NetworkPilot(
            id,
            Text(pilot, "callsign") ?? string.Empty,
            Number(pilot, "latitude"),
            Number(pilot, "longitude"),
            Whole(pilot, "altitude"),
            Whole(pilot, "groundspeed"),
            Heading(pilot, "heading"),
            Code(plan, "departure"),
            Code(plan, "arrival"),
            Code(plan, "aircraft_short"));
    }

    private static NetworkPilot? IvaoPilot(JsonElement pilot)
    {
        if (!TryId(Property(pilot, "userId"), out var id))
            return null;

        var track = Property(pilot, "lastTrack");
        var plan = Property(pilot, "flightPlan");
        return new NetworkPilot(
            id,
            Text(pilot, "callsign") ?? string.Empty,
            Number(track, "latitude"),
            Number(track, "longitude"),
            Whole(track, "altitude"),
            Whole(track, "groundSpeed"),
            Heading(track, "heading"),
            Code(plan, "departureId"),
            Code(plan, "arrivalId"),
            Code(plan, "aircraftId"));
    }

    private static IReadOnlyDictionary<int, NetworkPilot>? Read(string json, Func<JsonElement, JsonElement?> list, Func<JsonElement, NetworkPilot?> read)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Object || list(document.RootElement) is not { ValueKind: JsonValueKind.Array } pilots)
                return null;

            var result = new Dictionary<int, NetworkPilot>();
            foreach (var pilot in pilots.EnumerateArray())
            {
                if (pilot.ValueKind == JsonValueKind.Object && read(pilot) is { } value)
                    result.TryAdd(value.Id, value);
            }
            return result;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static JsonElement? Property(JsonElement? element, string name) =>
        element is { ValueKind: JsonValueKind.Object } value && value.TryGetProperty(name, out var property) ? property : null;

    private static string? Text(JsonElement? element, string name) =>
        Property(element, name) is { ValueKind: JsonValueKind.String } value && value.GetString()?.Trim() is { Length: > 0 } text ? text : null;

    private static string? Code(JsonElement? element, string name) => Text(element, name)?.ToUpperInvariant();

    private static double? Number(JsonElement? element, string name) =>
        Property(element, name) is { ValueKind: JsonValueKind.Number } value && value.TryGetDouble(out var number) && double.IsFinite(number) ? number : null;

    private static int Whole(JsonElement? element, string name) =>
        Number(element, name) is { } number ? (int)Math.Round(number) : 0;

    private static int Heading(JsonElement? element, string name) => ((Whole(element, name) % 360) + 360) % 360;

    private static bool TryId(JsonElement? element, out int value)
    {
        value = 0;
        return element switch
        {
            { ValueKind: JsonValueKind.Number } number => number.TryGetInt32(out value),
            { ValueKind: JsonValueKind.String } text => int.TryParse(text.GetString(), out value),
            _ => false
        };
    }
}