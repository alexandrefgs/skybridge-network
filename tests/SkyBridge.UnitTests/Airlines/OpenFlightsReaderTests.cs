using System.Text;
using SkyBridge.Infrastructure.Airlines;

namespace SkyBridge.UnitTests.Airlines;

public class OpenFlightsReaderTests
{
    private const string Airlines = """
        -1,"Unknown",\N,"-","N/A",\N,\N,"Y"
        1,"Private flight",\N,"-","N/A","","","Y"
        2,"135 Airways",\N,"","GNL","GENERAL","United States","N"
        2581,"Gol Transportes Aéreos",\N,"G3","GLO","GOL TRANSPORTE","Brazil","Y"
        4000,"Odd Codes, Inc.",\N,"??","1CH",\N,\N,"Y"
        """;

    private const string Routes = """
        G3,2581,FLN,2,GRU,3,,0,738
        G3,2581,GRU,3,FLN,2,Y,0,738
        G3,2581,GRU,3,GIG,4,,1,738
        G3,\N,GRU,3,GIG,4,,0,738
        G3,2581,GRU,3,GRU,3,,0,738
        """;

    private static Stream Open(string text) => new MemoryStream(Encoding.UTF8.GetBytes(text));

    [Fact]
    public void ReadAirlines_SkipsPlaceholdersAndParsesFields()
    {
        var airlines = OpenFlightsReader.ReadAirlines(Open(Airlines)).ToList();

        Assert.Equal(new[] { 2, 2581, 4000 }, airlines.Select(a => a.SourceId));

        var gol = airlines[1].Data;
        Assert.Equal("Gol Transportes Aéreos", gol.Name);
        Assert.Equal("G3", gol.IataCode);
        Assert.Equal("GLO", gol.IcaoCode);
        Assert.Equal("Brazil", gol.Country);
        Assert.True(gol.IsActive);
        Assert.False(airlines[0].Data.IsActive);
    }

    [Fact]
    public void ReadAirlines_DropsInvalidCodes()
    {
        var odd = OpenFlightsReader.ReadAirlines(Open(Airlines)).Single(a => a.SourceId == 4000).Data;

        Assert.Equal("Odd Codes, Inc.", odd.Name);
        Assert.Null(odd.IataCode);
        Assert.Null(odd.IcaoCode);
        Assert.Null(odd.Callsign);
    }

    [Fact]
    public void ReadRoutes_KeepsOnlyNonstopOperatedRoutes()
    {
        var routes = OpenFlightsReader.ReadRoutes(Open(Routes)).ToList();

        Assert.Equal(new[] { new OpenFlightsRoute(2581, "FLN", "GRU") }, routes);
    }
}