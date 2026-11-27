using SkyBridge.Application.Airlines;
using SkyBridge.Application.Common;

namespace SkyBridge.Application.Pireps;

public sealed record LogbookSearch(string? Period, int Page = 1, int PageSize = 20);

public sealed record LogbookSummary(
    int Flights,
    int FlightMinutes,
    int DistanceNm,
    int Earned,
    int? AverageLandingRateFpm,
    int Airports,
    string? FavoriteAircraft);

public sealed record LogbookResponse(string Period, LogbookSummary Summary, RouteNetworkResponse Network, PagedResult<PirepResponse> Flights);

public static class LogbookPeriods
{
    public const string Month = "30d";
    public const string Year = "1y";
    public const string All = "all";

    public static bool TrySince(string? period, DateTime nowUtc, out string normalized, out DateTime? since)
    {
        normalized = string.IsNullOrWhiteSpace(period) ? Month : period.Trim().ToLowerInvariant();
        since = normalized switch
        {
            Month => nowUtc.AddDays(-30),
            Year => nowUtc.AddYears(-1),
            _ => null
        };
        return normalized is Month or Year or All;
    }
}