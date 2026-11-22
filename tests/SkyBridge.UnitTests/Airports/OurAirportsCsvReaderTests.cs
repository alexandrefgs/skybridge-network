using System.Text;
using SkyBridge.Domain.Airports;
using SkyBridge.Infrastructure.Airports;

namespace SkyBridge.UnitTests.Airports;

public class OurAirportsCsvReaderTests
{
    private const string Csv = """
        "id","ident","type","name","latitude_deg","longitude_deg","elevation_ft","continent","iso_country","iso_region","municipality","scheduled_service","icao_code","iata_code","gps_code","local_code","home_link","wikipedia_link","keywords"
        5901,"SBFL","large_airport","Hercílio Luz International Airport",-27.670279,-48.552502,16,"SA","BR","BR-SC","Florianópolis","yes","SBFL","FLN","SBFL","SC0001",,,
        1,"SSKT","small_airport","Aeroclube de Santa Catarina",-27.6,-48.6,,"SA","BR","BR-SC","São José","no",,,"SSKT",,,,
        6523,"00A","heliport","Total RF Heliport",40.070985,-74.933689,11,"NA","US","US-PA","Bensalem","no",,,"K00A","00A",,,
        2,"SXXX","closed","Old Field",0,0,0,"SA","BR","BR-SC","Nowhere","no",,,,,,,
        3,"SBXQ","medium_airport","Test, With Comma",-10.5,-50.25,100,"SA","BR","BR-TO","Palmas","no",,,,,,,
        """;

    private static List<AirportData> Read() =>
        OurAirportsCsvReader.Read(new MemoryStream(Encoding.UTF8.GetBytes(Csv))).ToList();

    [Fact]
    public void Read_KeepsOnlyAirports()
    {
        Assert.Equal(new[] { "SBFL", "SSKT", "SBXQ" }, Read().Select(a => a.Ident));
    }

    [Fact]
    public void Read_ParsesAllFields()
    {
        var expected = new AirportData("SBFL", "SBFL", "FLN", "Hercílio Luz International Airport", AirportType.Large,
            -27.670279, -48.552502, 16, "BR", "BR-SC", "Florianópolis", true);

        Assert.Equal(expected, Read()[0]);
    }

    [Fact]
    public void Read_HandlesMissingValuesAndQuotedCommas()
    {
        var airports = Read();

        Assert.Null(airports[1].ElevationFt);
        Assert.Null(airports[1].IcaoCode);
        Assert.Null(airports[1].IataCode);
        Assert.Equal("Test, With Comma", airports[2].Name);
        Assert.Equal(AirportType.Medium, airports[2].Type);
    }
}