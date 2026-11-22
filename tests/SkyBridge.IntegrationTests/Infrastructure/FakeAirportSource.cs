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

    public Task<Stream> OpenAirportsCsvAsync(CancellationToken cancellationToken) =>
        Task.FromResult<Stream>(new MemoryStream(Encoding.UTF8.GetBytes(Csv)));
}