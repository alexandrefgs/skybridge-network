using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.VisualBasic.FileIO;
using SkyBridge.Application.Airlines;

namespace SkyBridge.Infrastructure.Airlines;

public enum RouteFileFormat
{
    Rpl,
    Csv
}

public sealed record RouteFileRow(
    int Line,
    string Origin,
    string Destination,
    IReadOnlyList<string> Aircraft,
    string? AtsRoute,
    int? FlightLevel);

public sealed record RouteFile(
    RouteFileFormat Format,
    string? AirlineCode,
    DateOnly? Edition,
    IReadOnlyList<RouteFileRow> Rows,
    IReadOnlyList<RouteImportIssue> Issues);

public static partial class RouteFileReader
{
    private static readonly string[] Months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

    public static RouteFile Read(Stream stream)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var lines = reader.ReadToEnd().Split(["\r\n", "\n"], StringSplitOptions.None);

        return lines.Any(line => RplRecord().IsMatch(line) || RplAirline().IsMatch(line))
            ? ReadRpl(lines)
            : ReadCsv(lines);
    }

    private static RouteFile ReadRpl(string[] lines)
    {
        string? airline = null;
        DateOnly? edition = null;
        var issues = new List<RouteImportIssue>();
        var flights = new List<(int Line, string Origin, string Destination, string Type, int Level, StringBuilder Route)>();
        StringBuilder? lastRoute = null;

        for (var index = 0; index < lines.Length; index++)
        {
            var line = lines[index];
            var number = index + 1;

            var airlineMatch = RplAirline().Match(line);
            if (airlineMatch.Success)
            {
                airline ??= airlineMatch.Groups[1].Value;
                edition ??= ParseEdition(line);
                lastRoute = null;
                continue;
            }

            if (RplRecord().IsMatch(line))
            {
                var padded = line.PadRight(104);
                var type = padded[33..39].Split('/')[0].Trim();
                var origin = padded[40..44];
                var level = padded[55..58];
                var destination = padded[95..99];

                if (!AircraftCode().IsMatch(type) || !AirportCode().IsMatch(origin) || !AirportCode().IsMatch(destination) ||
                    !int.TryParse(level, NumberStyles.None, CultureInfo.InvariantCulture, out var flightLevel))
                {
                    issues.Add(new RouteImportIssue(number, "Unrecognized RPL line."));
                    lastRoute = null;
                    continue;
                }

                lastRoute = new StringBuilder(padded[59..94].Trim());
                flights.Add((number, origin, destination, type, flightLevel, lastRoute));
                continue;
            }

            if (lastRoute is not null && line.Length > 59 && string.IsNullOrWhiteSpace(line[..59]))
            {
                var continuation = line[59..Math.Min(line.Length, 94)].Trim();
                if (continuation.Length > 0)
                    lastRoute.Append(' ').Append(continuation);
                continue;
            }

            if (line.Trim().Length > 0)
                lastRoute = null;
        }

        var rows = flights
            .GroupBy(f => (f.Origin, f.Destination))
            .Select(group =>
            {
                var aircraft = group
                    .GroupBy(f => f.Type)
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key, StringComparer.Ordinal)
                    .Select(g => g.Key)
                    .ToList();

                var usual = group
                    .GroupBy(f => (Route: f.Route.ToString().Trim(), f.Level))
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.First().Line)
                    .First().Key;

                return new RouteFileRow(group.First().Line, group.Key.Origin, group.Key.Destination, aircraft,
                    usual.Route.Length == 0 ? null : usual.Route, ValidLevel(usual.Level));
            })
            .OrderBy(row => row.Line)
            .ToList();

        return new RouteFile(RouteFileFormat.Rpl, airline, edition, rows, issues);
    }

    private static RouteFile ReadCsv(string[] lines)
    {
        var rows = new List<RouteFileRow>();
        var issues = new List<RouteImportIssue>();
        var seen = new HashSet<(string, string)>();

        using var parser = new TextFieldParser(new StringReader(string.Join('\n', lines)))
        {
            TextFieldType = FieldType.Delimited,
            HasFieldsEnclosedInQuotes = true,
            TrimWhiteSpace = true
        };
        parser.SetDelimiters(",", ";");

        Dictionary<string, int>? columns = null;

        while (!parser.EndOfData)
        {
            var number = (int)parser.LineNumber;
            string[]? fields;
            try
            {
                fields = parser.ReadFields();
            }
            catch (MalformedLineException exception)
            {
                issues.Add(new RouteImportIssue((int)exception.LineNumber, "Malformed CSV line."));
                continue;
            }

            if (fields is null || fields.All(string.IsNullOrWhiteSpace))
                continue;

            if (columns is null)
            {
                columns = fields
                    .Select((name, position) => (Name: name.Trim().ToLowerInvariant(), Position: position))
                    .GroupBy(c => c.Name)
                    .ToDictionary(g => g.Key, g => g.First().Position);

                if (!columns.ContainsKey("origin") || !columns.ContainsKey("destination"))
                {
                    issues.Add(new RouteImportIssue(number, "The first line must be the header: origin,destination,aircraft,route,fl"));
                    break;
                }
                continue;
            }

            var origin = Field(fields, columns, "origin").ToUpperInvariant();
            var destination = Field(fields, columns, "destination").ToUpperInvariant();
            if (!AirportIdent().IsMatch(origin) || !AirportIdent().IsMatch(destination))
            {
                issues.Add(new RouteImportIssue(number, "Origin and destination are required airport codes."));
                continue;
            }

            if (!seen.Add((origin, destination)))
            {
                issues.Add(new RouteImportIssue(number, $"Duplicate route {origin}-{destination}, line ignored."));
                continue;
            }

            var aircraft = AircraftSeparator().Split(Field(fields, columns, "aircraft").ToUpperInvariant())
                .Where(code => code.Length > 0)
                .Distinct()
                .ToList();

            int? level = null;
            var levelText = Field(fields, columns, "fl");
            if (levelText.Length > 0)
            {
                level = ParseLevel(levelText);
                if (level is null)
                    issues.Add(new RouteImportIssue(number, $"Invalid flight level '{levelText}', ignored."));
            }

            var route = Field(fields, columns, "route");
            rows.Add(new RouteFileRow(number, origin, destination, aircraft, route.Length == 0 ? null : route, level));
        }

        if (columns is null)
            issues.Add(new RouteImportIssue(1, "The file is empty."));

        return new RouteFile(RouteFileFormat.Csv, null, null, rows, issues);
    }

    private static string Field(string[] fields, Dictionary<string, int> columns, string column) =>
        columns.TryGetValue(column, out var index) && index < fields.Length ? fields[index].Trim() : string.Empty;

    private static int? ParseLevel(string text)
    {
        var value = text.Trim().ToUpperInvariant();
        if (value.StartsWith("FL", StringComparison.Ordinal))
            value = value[2..];
        return int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var level) ? ValidLevel(level) : null;
    }

    private static int? ValidLevel(int level) => level is >= 10 and <= 600 ? level : null;

    private static DateOnly? ParseEdition(string line)
    {
        var match = RplEdition().Match(line);
        if (!match.Success)
            return null;

        var month = Array.IndexOf(Months, match.Groups[2].Value.ToLowerInvariant()) + 1;
        return month > 0 ? new DateOnly(int.Parse(match.Groups[3].Value), month, int.Parse(match.Groups[1].Value)) : null;
    }

    [GeneratedRegex(@"^ {3}\d{6} \d{6} [0-7]{7} ")]
    private static partial Regex RplRecord();

    [GeneratedRegex(@"^CIA:\s*([A-Z0-9]{3})\b")]
    private static partial Regex RplAirline();

    [GeneratedRegex(@"VALIDADE:\s*(\d{1,2})([A-Za-z]{3})\.?(\d{4})")]
    private static partial Regex RplEdition();

    [GeneratedRegex("^[A-Z]{4}$")]
    private static partial Regex AirportCode();

    [GeneratedRegex("^[A-Z0-9-]{3,10}$")]
    private static partial Regex AirportIdent();

    [GeneratedRegex("^[A-Z0-9]{2,4}$")]
    private static partial Regex AircraftCode();

    [GeneratedRegex(@"[\s;|]+")]
    private static partial Regex AircraftSeparator();
}