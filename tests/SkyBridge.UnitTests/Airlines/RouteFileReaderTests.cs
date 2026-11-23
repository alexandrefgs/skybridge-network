using System.Text;
using SkyBridge.Infrastructure.Airlines;

namespace SkyBridge.UnitTests.Airlines;

public class RouteFileReaderTests
{
    private static RouteFile Read(string text) => RouteFileReader.Read(new MemoryStream(Encoding.UTF8.GetBytes(text)));

    [Fact]
    public void Read_Rpl_GroupsFlightsByCityPair()
    {
        var file = Read(RplSample.Header("GLO") +
            RplSample.Flight("GLO1000", "B738", "SBSP", "SBRJ", 270, "NIBRU UZ171 KEVUN") +
            RplSample.Flight("GLO1002", "B737", "SBSP", "SBRJ", 270, "NIBRU UZ171 KEVUN") +
            RplSample.Flight("GLO1004", "B738", "SBSP", "SBRJ", 250, "NIBRU UZ171 KEVUN") +
            RplSample.Flight("GLO1001", "B738", "SBRJ", "SBSP", 320, "NAXOP UZ45 IBDAL"));

        Assert.Equal(RouteFileFormat.Rpl, file.Format);
        Assert.Equal("GLO", file.AirlineCode);
        Assert.Equal(new DateOnly(2026, 11, 19), file.Edition);
        Assert.Empty(file.Issues);
        Assert.Equal(2, file.Rows.Count);

        var first = file.Rows[0];
        Assert.Equal(("SBSP", "SBRJ"), (first.Origin, first.Destination));
        Assert.Equal(new[] { "B738", "B737" }, first.Aircraft);
        Assert.Equal("NIBRU UZ171 KEVUN", first.AtsRoute);
        Assert.Equal(270, first.FlightLevel);
    }

    [Fact]
    public void Read_Rpl_JoinsRouteContinuationLines()
    {
        var file = Read(RplSample.Header("AZU") +
            RplSample.Flight("AZU4000", "A20N", "SBKP", "SBBV", 380, "KIGOX DCT ILVIS DCT DARDA") +
            RplSample.Continuation("DCT EDNOS DCT MOPLI"));

        Assert.Equal("KIGOX DCT ILVIS DCT DARDA DCT EDNOS DCT MOPLI", file.Rows.Single().AtsRoute);
    }

    [Fact]
    public void Read_Csv_ParsesOptionalColumnsAndLevels()
    {
        var file = Read("""
            origin,destination,aircraft,route,fl
            sbfl,SBGR,b738 B38M,NIBRU UZ171 KEVUN,FL370
            SBGR,SBFL,B738,,
            """);

        Assert.Equal(RouteFileFormat.Csv, file.Format);
        Assert.Empty(file.Issues);
        var first = file.Rows[0];
        Assert.Equal((2, "SBFL", "SBGR", "NIBRU UZ171 KEVUN", (int?)370), (first.Line, first.Origin, first.Destination, first.AtsRoute, first.FlightLevel));
        Assert.Equal(new[] { "B738", "B38M" }, first.Aircraft);
        Assert.Null(file.Rows[1].AtsRoute);
        Assert.Null(file.Rows[1].FlightLevel);
    }

    [Fact]
    public void Read_Csv_ReportsBadLines()
    {
        var file = Read("""
            origin,destination,aircraft,route,fl
            SBFL,SBGR,,,
            SBFL,SBGR,,,
            ,SBGR,,,
            SBFL,SBRJ,,,999
            """);

        Assert.Equal(2, file.Rows.Count);
        Assert.Equal(new[] { 3, 4, 5 }, file.Issues.Select(i => i.Line));
        Assert.Null(file.Rows[1].FlightLevel);
    }

    [Fact]
    public void Read_Csv_RequiresTheHeader()
    {
        var file = Read("SBFL,SBGR\n");

        Assert.Empty(file.Rows);
        Assert.Contains("header", file.Issues.Single().Message);
    }
}