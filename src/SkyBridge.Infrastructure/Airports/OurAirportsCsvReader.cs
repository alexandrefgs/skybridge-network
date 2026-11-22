using System.Globalization;
using System.Text;
using Microsoft.VisualBasic.FileIO;
using SkyBridge.Domain.Airports;

namespace SkyBridge.Infrastructure.Airports;

public static class OurAirportsCsvReader
{
    private static readonly Dictionary<string, AirportType> Types = new()
    {
        ["small_airport"] = AirportType.Small,
        ["medium_airport"] = AirportType.Medium,
        ["large_airport"] = AirportType.Large
    };

    public static IEnumerable<AirportData> Read(Stream stream)
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
            if (fields is null || !Types.TryGetValue(Field(fields, columns, "type"), out var type))
                continue;

            var ident = Field(fields, columns, "ident");
            var name = Field(fields, columns, "name");
            if (ident.Length == 0 || name.Length == 0)
                continue;

            yield return new AirportData(
                Ident: ident,
                IcaoCode: Optional(fields, columns, "icao_code"),
                IataCode: Optional(fields, columns, "iata_code"),
                Name: name,
                Type: type,
                Latitude: double.Parse(Field(fields, columns, "latitude_deg"), CultureInfo.InvariantCulture),
                Longitude: double.Parse(Field(fields, columns, "longitude_deg"), CultureInfo.InvariantCulture),
                ElevationFt: int.TryParse(Field(fields, columns, "elevation_ft"), NumberStyles.Integer, CultureInfo.InvariantCulture, out var elevation) ? elevation : null,
                CountryCode: Field(fields, columns, "iso_country"),
                RegionCode: Field(fields, columns, "iso_region"),
                Municipality: Optional(fields, columns, "municipality"),
                ScheduledService: Field(fields, columns, "scheduled_service") == "yes");
        }
    }

    private static string Field(string[] fields, Dictionary<string, int> columns, string column) =>
        columns.TryGetValue(column, out var index) && index < fields.Length ? fields[index] : string.Empty;

    private static string? Optional(string[] fields, Dictionary<string, int> columns, string column)
    {
        var value = Field(fields, columns, column);
        return value.Length == 0 ? null : value;
    }
}