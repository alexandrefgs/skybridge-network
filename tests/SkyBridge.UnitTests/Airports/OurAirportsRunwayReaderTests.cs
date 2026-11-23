using System.Text;
using SkyBridge.Domain.Airports;
using SkyBridge.Infrastructure.Airports;

namespace SkyBridge.UnitTests.Airports;

public class OurAirportsRunwayReaderTests
{
    private const string Csv = """
        "id","airport_ref","airport_ident","length_ft","width_ft","surface","lighted","closed","le_ident","le_latitude_deg","le_longitude_deg","le_elevation_ft","le_heading_degT","le_displaced_threshold_ft","he_ident","he_latitude_deg","he_longitude_deg","he_elevation_ft","he_heading_degT","he_displaced_threshold_ft"
        234561,5910,"SBGR",12139,148,"ASP",1,0,"10L",-23.4,-46.5,2459,97.27,,"28R",-23.4,-46.4,2441,277.3,
        234562,5910,"SBGR",9843,148,"ASP",1,1,"10R",,,,97,,"28L",,,,,
        255155,6524,"00AK",2500,40,"GRVL",0,0,"n",,,,,,"s",,,,,
        255156,6525,"00AL",,,,0,0,"",,,,,,"",,,,,
        """;

    private static List<OurAirportsRunway> Read() =>
        OurAirportsRunwayReader.Read(new MemoryStream(Encoding.UTF8.GetBytes(Csv))).ToList();

    [Fact]
    public void Read_SkipsClosedRunways()
    {
        Assert.Equal(new[] { 234561, 255155, 255156 }, Read().Select(r => r.Runway.SourceId));
    }

    [Fact]
    public void Read_ParsesAllFields()
    {
        var expected = new OurAirportsRunway("SBGR",
            new RunwayData(234561, "10L", "28R", 12139, 148, "ASP", RunwaySurface.Paved, true, 97.3));

        Assert.Equal(expected, Read()[0]);
    }

    [Fact]
    public void Read_HandlesMissingValues_AndNormalizesIdents()
    {
        var runways = Read();

        Assert.Equal(("N", "S", RunwaySurface.Unpaved), (runways[1].Runway.LowEndIdent, runways[1].Runway.HighEndIdent, runways[1].Runway.SurfaceType));
        Assert.Equal(new RunwayData(255156, null, null, null, null, null, RunwaySurface.Unknown, false, null), runways[2].Runway);
    }
}