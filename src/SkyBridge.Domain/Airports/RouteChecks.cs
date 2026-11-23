using System.Globalization;

namespace SkyBridge.Domain.Aircraft;

public sealed record AircraftLimits(string IcaoCode, int RangeNm, int MinRunwayFt, bool RequiresPavedRunway);

public sealed record AirportRunways(string Code, int? LongestRunwayFt, int? LongestHardRunwayFt);

public static class RouteChecks
{
    public static IReadOnlyList<string> Warnings(int distanceNm, AirportRunways origin, AirportRunways destination, IEnumerable<AircraftLimits> aircraft)
    {
        var warnings = new List<string>();

        foreach (var type in aircraft)
        {
            if (distanceNm > type.RangeNm)
                warnings.Add($"{type.IcaoCode}: {Number(distanceNm)} nm is beyond its {Number(type.RangeNm)} nm range");

            foreach (var airport in origin.Code == destination.Code ? [origin] : new[] { origin, destination })
            {
                var fit = RunwayRules.Check(type.MinRunwayFt, type.RequiresPavedRunway, airport.LongestRunwayFt, airport.LongestHardRunwayFt);
                if (fit == RunwayFit.TooShort)
                    warnings.Add($"{type.IcaoCode} needs {Number(type.MinRunwayFt)} ft, {airport.Code} longest runway is {Number(airport.LongestRunwayFt!.Value)} ft");
                else if (fit == RunwayFit.NeedsPaved)
                    warnings.Add($"{type.IcaoCode} needs a paved runway at {airport.Code}");
            }
        }

        return warnings;
    }

    private static string Number(int value) => value.ToString("N0", CultureInfo.InvariantCulture);
}