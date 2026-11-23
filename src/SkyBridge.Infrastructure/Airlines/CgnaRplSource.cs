using System.Net;
using System.Text;
using SkyBridge.Application.Airlines;

namespace SkyBridge.Infrastructure.Airlines;

internal sealed class CgnaRplSource(HttpClient http, TimeProvider time) : IRplSource
{
    private const int DaysToSearch = 14;

    public async Task<RplDownload?> DownloadAsync(string airlineIcao, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);

        for (var day = 0; day < DaysToSearch; day++)
        {
            var edition = today.AddDays(-day);
            using var response = await http.GetAsync(
                $"{edition:yyyy-MM-dd}/painel_rpl/companhias/Cia_{airlineIcao}_CS.txt", cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound)
                continue;
            response.EnsureSuccessStatusCode();

            var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
            if (!Encoding.UTF8.GetString(bytes).Contains("Planos de Voo Repetitivos", StringComparison.Ordinal))
                continue;

            return new RplDownload(edition, new MemoryStream(bytes));
        }

        return null;
    }
}