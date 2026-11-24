using System.Globalization;
using System.Xml;
using System.Xml.Linq;
using SkyBridge.Domain.FlightPlans;

namespace SkyBridge.Application.FlightPlans;

public sealed record SimBriefResult(FlightPlanData? Plan, string? Error)
{
    public static SimBriefResult Fail(string error) => new(null, error);
}

public static class SimBriefOfpParser
{
    public const double KgPerLb = 0.45359237;

    public static SimBriefResult Parse(string xml)
    {
        XElement root;
        try
        {
            root = XDocument.Parse(xml).Root ?? throw new XmlException("Empty document.");
        }
        catch (XmlException)
        {
            return SimBriefResult.Fail("SimBrief sent an answer we could not read. Try again in a moment.");
        }

        if (root.Name.LocalName == "error")
            return SimBriefResult.Fail(Clean(root.Value) ?? "SimBrief could not find a flight plan.");

        var status = Text(root, "fetch", "status");
        if (status is not null && status.StartsWith("Error", StringComparison.OrdinalIgnoreCase))
            return SimBriefResult.Fail(status.Replace("Error:", "", StringComparison.OrdinalIgnoreCase).Trim() is { Length: > 0 } message ? message : status);

        var origin = Text(root, "origin", "icao_code");
        var destination = Text(root, "destination", "icao_code");
        var aircraft = Text(root, "aircraft", "icaocode") ?? Text(root, "aircraft", "icao_code");
        var id = Text(root, "params", "request_id");
        if (origin is null || destination is null || aircraft is null || id is null)
            return SimBriefResult.Fail("Your latest SimBrief flight plan is incomplete. Generate it again.");

        var pounds = string.Equals(Text(root, "params", "units"), "lbs", StringComparison.OrdinalIgnoreCase);
        int Weight(string section, string field) => ToKg(Number(Text(root, section, field)), pounds);

        var generated = Number(Text(root, "params", "time_generated")) is var seconds and > 0
            ? DateTime.UnixEpoch.AddSeconds(seconds)
            : DateTime.MinValue;

        var airline = Text(root, "general", "icao_airline");
        var flightNumber = Text(root, "general", "flight_number");
        var callsign = Text(root, "atc", "callsign") ?? (airline is null && flightNumber is null ? null : $"{airline}{flightNumber}");

        var distance = Number(Text(root, "general", "air_distance"));
        if (distance <= 0)
            distance = Number(Text(root, "general", "route_distance"));

        var blockFuel = Weight("fuel", "plan_ramp");
        var takeoffFuel = Weight("fuel", "plan_takeoff");
        var landingFuel = Weight("fuel", "plan_landing");
        var trip = Weight("fuel", "enroute_burn");

        return new SimBriefResult(new FlightPlanData(
            id,
            generated,
            Text(root, "params", "airac"),
            origin,
            destination,
            Text(root, "alternate", "icao_code"),
            aircraft,
            Text(root, "aircraft", "reg"),
            callsign,
            Text(root, "general", "route") ?? "DCT",
            (int)Number(Text(root, "general", "initial_altitude")),
            (int)Math.Round(distance),
            (int)Math.Round(Number(Text(root, "times", "est_time_enroute")) / 60),
            blockFuel,
            takeoffFuel,
            landingFuel,
            trip > 0 ? trip : Math.Max(0, takeoffFuel - landingFuel),
            (int)Number(Text(root, "weights", "pax_count")),
            Weight("weights", "cargo"),
            Weight("weights", "est_zfw"),
            Weight("weights", "est_tow"),
            Weight("weights", "est_ldw")), null);
    }

    private static int ToKg(double value, bool pounds) =>
        (int)Math.Round(pounds ? value * KgPerLb : value, MidpointRounding.AwayFromZero);

    private static double Number(string? text) =>
        double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out var value) ? value : 0;

    private static string? Text(XElement root, string section, string field) =>
        Clean(root.Element(section)?.Element(field)?.Value);

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}