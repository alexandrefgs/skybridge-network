using System.Text;
using SkyBridge.Application.Airports;

namespace SkyBridge.IntegrationTests.Infrastructure;

public sealed class FakeAirportSource : IAirportSource
{
    public const string Csv = """
        "id","ident","type","name","latitude_deg","longitude_deg","elevation_ft","continent","iso_country","iso_region","municipality","scheduled_service","icao_code","iata_code","gps_code","local_code","home_link","wikipedia_link","keywords"
        5901,"SBFL","large_airport","Hercílio Luz International Airport",-27.670279,-48.552502,16,"SA","BR","BR-SC","Florianópolis","yes","SBFL","FLN","SBFL","SC0001",,,
        5910,"SBGR","large_airport","Guarulhos International Airport",-23.431944,-46.467778,2461,"SA","BR","BR-SP","São Paulo","yes","SBGR","GRU","SBGR","SP0002",,,
        1,"SSKT","small_airport","Aeroclube de Santa Catarina",-27.6,-48.6,,"SA","BR","BR-SC","São José","no",,,"SSKT",,,,
        6523,"00A","heliport","Total RF Heliport",40.070985,-74.933689,11,"NA","US","US-PA","Bensalem","no",,,"K00A","00A",,,
        3,"SBXQ","medium_airport","Test, With Comma",-10.5,-50.25,100,"SA","BR","BR-TO","Palmas","no",,,,,,,
        """;

    public const string RunwaysCsv = """
        "id","airport_ref","airport_ident","length_ft","width_ft","surface","lighted","closed","le_ident","le_latitude_deg","le_longitude_deg","le_elevation_ft","le_heading_degT","le_displaced_threshold_ft","he_ident","he_latitude_deg","he_longitude_deg","he_elevation_ft","he_heading_degT","he_displaced_threshold_ft"
        100,5901,"SBFL",7874,148,"ASP",1,0,"14",,,,136.2,,"32",,,,,
        101,5901,"SBFL",4331,148,"CON",1,0,"03",,,,23,,"21",,,,,
        102,5910,"SBGR",12139,148,"ASP",1,0,"10L",,,,97,,"28R",,,,,
        103,5910,"SBGR",9843,148,"ASP",1,0,"10R",,,,97,,"28L",,,,,
        104,1,"SSKT",2500,60,"GRS",0,0,"15",,,,,,"33",,,,,
        105,1,"SSKT",3000,60,"WATER",0,0,"18W",,,,,,"36W",,,,,
        106,1,"SSKT",5000,60,"ASP",0,1,"09",,,,,,"27",,,,,
        107,6523,"00A",80,80,"ASPH-G",1,0,"H1",,,,,,,,,,,
        """;

    public Task<Stream> OpenAirportsCsvAsync(CancellationToken cancellationToken) =>
        Task.FromResult<Stream>(new MemoryStream(Encoding.UTF8.GetBytes(Csv)));

    public Task<Stream> OpenRunwaysCsvAsync(CancellationToken cancellationToken) =>
        Task.FromResult<Stream>(new MemoryStream(Encoding.UTF8.GetBytes(RunwaysCsv)));
}