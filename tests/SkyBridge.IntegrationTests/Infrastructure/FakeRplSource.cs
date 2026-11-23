using System.Text;
using SkyBridge.Application.Airlines;

namespace SkyBridge.IntegrationTests.Infrastructure;

public sealed class FakeRplSource : IRplSource
{
    public static readonly DateOnly Edition = new(2026, 11, 19);

    public Task<RplDownload?> DownloadAsync(string airlineIcao, CancellationToken cancellationToken)
    {
        if (airlineIcao == "NON")
            return Task.FromResult<RplDownload?>(null);

        var text = Rpl.Header(airlineIcao) +
            Rpl.Flight($"{airlineIcao}1000", "B738", "SBFL", "SBGR", 330, "UZ10 BUXUK") +
            Rpl.Flight($"{airlineIcao}1001", "B738", "SBGR", "SBFL", 340, "UZ11 TOMIK");

        return Task.FromResult<RplDownload?>(new RplDownload(Edition, new MemoryStream(Encoding.UTF8.GetBytes(text))));
    }
}

public static class Rpl
{
    public static string Header(string airline) =>
        "\r\n                                               Planos de Voo Repetitivos\r\n\r\n" +
        $"CIA: {airline}                                    INÍCIO DE VALIDADE: 19nov.2026                                       PAG.: 1\r\n" +
        "-----------------------------------------------------------------------------------------------------------------------------------------\r\n";

    public static string Flight(string ident, string type, string origin, string destination, int level, string route) =>
        $"   191126 251126 1234500 {ident,-7} {type}/M {origin}0910 N0450 {level:000} {route,-36}{destination}0043 EQPT/SDFGIKRWY/LB1\r\n";
}