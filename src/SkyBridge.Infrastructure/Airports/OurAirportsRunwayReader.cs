using System.Globalization;
using System.Text;
using Microsoft.VisualBasic.FileIO;
using SkyBridge.Domain.Airports;

namespace SkyBridge.Infrastructure.Airports;

public sealed record OurAirportsRunway(string AirportIdent, RunwayData Runway);

public static class OurAirportsRunwayReader
{
    public static IEnumerable<OurAirportsRunway> Read(Stream stream)
    {
        using var parser = new TextFieldParser(stream, Encoding.UTF8)
        {
            TextFieldType = FieldType.Delimited,
            HasFieldsEnclosedInQuotes = true,
            TrimWhiteSpace = true
        };
        parser.SetDelimiters(",");

        var header = parser.ReadFields() ?? [];
        var columns = header
            .Select((name, index) => (name, index))
            .ToDictionary(c => c.name, c => c.index, StringComparer.OrdinalIgnoreCase);

        while (!parser.EndOfData)
        {
            var fields = parser.ReadFields();
            if (fields is null || Field(fields, columns, "closed") == "1")
                continue;

            var airportIdent = Field(fields, columns, "airport_ident");
            if (airportIdent.Length == 0 || !int.TryParse(Field(fields, columns, "id"), CultureInfo.InvariantCulture, out var sourceId))
                continue;

            var surface = Optional(fields, columns, "surface");

            yield return new OurAirportsRunway(airportIdent, new RunwayData(
                SourceId: sourceId,
                LowEndIdent: Ident(fields, columns, "le_ident"),
                HighEndIdent: Ident(fields, columns, "he_ident"),
                LengthFt: Positive(fields, columns, "length_ft"),
                WidthFt: Positive(fields, columns, "width_ft"),
                Surface: surface,
                SurfaceType: RunwaySurfaces.Classify(surface),
                Lighted: Field(fields, columns, "lighted") == "1",
                HeadingDegT: double.TryParse(Field(fields, columns, "le_heading_degT"), NumberStyles.Float, CultureInfo.InvariantCulture, out var heading)
                    ? Math.Round(heading, 1)
                    : null));
        }
    }

    private static string Field(string[] fields, Dictionary<string, int> columns, string column) =>
        columns.TryGetValue(column, out var index) && index < fields.Length ? fields[index] : string.Empty;

    private static string? Optional(string[] fields, Dictionary<string, int> columns, string column)
    {
        var value = Field(fields, columns, column);
        return value.Length == 0 ? null : value.Length > 50 ? value[..50] : value;
    }

    private static string? Ident(string[] fields, Dictionary<string, int> columns, string column)
    {
        var value = Field(fields, columns, column).ToUpperInvariant();
        return value.Length is 0 or > 10 ? null : value;
    }

    private static int? Positive(string[] fields, Dictionary<string, int> columns, string column) =>
        int.TryParse(Field(fields, columns, column), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value) && value > 0
            ? value
            : null;
}