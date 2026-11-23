using System.Text;
using SkyBridge.Application.Airlines;

namespace SkyBridge.IntegrationTests.Infrastructure;

public sealed class FakeAirlineSource : IAirlineSource
{
    public const string Airlines = """
        -1,"Unknown",\N,"-","N/A",\N,\N,"Y"
        2581,"Gol Transportes Aéreos",\N,"G3","GLO","GOL TRANSPORTE","Brazil","Y"
        3200,"Old Air",\N,"","OLD","OLDIE","Brazil","N"
        """;

    public const string Routes = """
        G3,2581,FLN,2,GRU,3,,0,738
        G3,2581,GRU,3,FLN,2,,0,738 73H
        G3,2581,FLN,2,GRU,3,Y,0,738
        G3,2581,FLN,2,TXL,4,,0,738
        XX,9999,FLN,2,GRU,3,,0,738
        """;

    public Task<Stream> OpenAirlinesAsync(CancellationToken cancellationToken) => Open(Airlines);

    public Task<Stream> OpenRoutesAsync(CancellationToken cancellationToken) => Open(Routes);

    private static Task<Stream> Open(string text) => Task.FromResult<Stream>(new MemoryStream(Encoding.UTF8.GetBytes(text)));
}