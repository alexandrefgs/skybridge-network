using System.Text;
using System.Text.RegularExpressions;
using Microsoft.VisualBasic.FileIO;
using SkyBridge.Domain.Airlines;

namespace SkyBridge.Infrastructure.Airlines;

public sealed record OpenFlightsAirline(int SourceId, AirlineData Data);

public sealed record OpenFlightsRoute(int AirlineSourceId, string Origin, string Destination);

public static partial class OpenFlightsReader
{
    public static IEnumerable<OpenFlightsAirline> ReadAirlines(Stream stream)
    {
        foreach (var fields in ReadRows(stream))
        {
            if (fields.Length < 8 || !int.TryParse(fields[0], out var id) || id < 2)
                continue;

            var name = Value(fields[1]);
            if (name is null)
                continue;

            var iata = Value(fields[3])?.ToUpperInvariant();
            var icao = Value(fields[4])?.ToUpperInvariant();

            yield return new OpenFlightsAirline(id, new AirlineData(
                Name: name,
                IataCode: iata is not null && IataPattern().IsMatch(iata) ? iata : null,
                IcaoCode: icao is not null && IcaoPattern().IsMatch(icao) ? icao : null,
                Callsign: Value(fields[5]),
                Country: Value(fields[6]),
                IsActive: string.Equals(fields[7], "Y", StringComparison.OrdinalIgnoreCase)));
        }
    }

    public static IEnumerable<OpenFlightsRoute> ReadRoutes(Stream stream)
    {
        foreach (var fields in ReadRows(stream))
        {
            if (fields.Length < 8 || !int.TryParse(fields[1], out var airlineId))
                continue;

            var codeshare = string.Equals(fields[6], "Y", StringComparison.OrdinalIgnoreCase);
            if (codeshare || fields[7] != "0")
                continue;

            var origin = Value(fields[2]);
            var destination = Value(fields[4]);
            if (origin is null || destination is null || origin == destination)
                continue;

            yield return new OpenFlightsRoute(airlineId, origin.ToUpperInvariant(), destination.ToUpperInvariant());
        }
    }

    private static IEnumerable<string[]> ReadRows(Stream stream)
    {
        using var parser = new TextFieldParser(stream, Encoding.UTF8)
        {
            TextFieldType = FieldType.Delimited,
            HasFieldsEnclosedInQuotes = true,
            TrimWhiteSpace = true
        };
        parser.SetDelimiters(",");

        while (!parser.EndOfData)
        {
            string[]? fields;
            try
            {
                fields = parser.ReadFields();
            }
            catch (MalformedLineException)
            {
                continue;
            }

            if (fields is not null)
                yield return fields;
        }
    }

    private static string? Value(string field) =>
        string.IsNullOrWhiteSpace(field) || field == "\\N" ? null : field.Trim();

    [GeneratedRegex("^[A-Z0-9]{2}$")]
    private static partial Regex IataPattern();

    [GeneratedRegex("^[A-Z]{3}$")]
    private static partial Regex IcaoPattern();
}