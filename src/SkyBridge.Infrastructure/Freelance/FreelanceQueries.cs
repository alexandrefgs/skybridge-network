using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Common;
using SkyBridge.Application.Freelance;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Freelance;
using SkyBridge.Infrastructure.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Freelance;

internal sealed class FreelanceQueries(SkyBridgeDbContext db, TimeProvider time) : IFreelanceQueries
{
    private const int MaxPageSize = 100;

    public async Task<PagedResult<FreelanceJobResponse>> SearchAsync(FreelanceJobSearch search, CancellationToken cancellationToken)
    {
        var page = Math.Max(search.Page, 1);
        var pageSize = Math.Clamp(search.PageSize, 1, MaxPageSize);
        var now = time.GetUtcNow().UtcDateTime;

        var query = db.FreelanceJobs.AsNoTracking();

        if (!search.IncludeExpired)
            query = query.Where(j => j.ExpiresAtUtc > now);

        if (!string.IsNullOrWhiteSpace(search.From))
        {
            var from = AirportCodes.Normalize(search.From);
            query = query.Where(j => db.Airports.Any(a => a.Id == j.OriginAirportId && (a.IcaoCode ?? a.Ident) == from));
        }

        var total = await query.CountAsync(cancellationToken);

        var ordered = search.IncludeExpired
            ? query.OrderByDescending(j => j.CreatedAtUtc)
            : query.OrderBy(j => j.ExpiresAtUtc);

        var jobs = await ordered
            .Include(j => j.Legs)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return new PagedResult<FreelanceJobResponse>(await ToResponsesAsync(jobs, now, cancellationToken), page, pageSize, total);
    }

    public async Task<FreelanceJobResponse?> GetAsync(int id, CancellationToken cancellationToken)
    {
        var job = await db.FreelanceJobs.AsNoTracking().Include(j => j.Legs).FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
        return job is null ? null : (await ToResponsesAsync([job], time.GetUtcNow().UtcDateTime, cancellationToken))[0];
    }

    private async Task<List<FreelanceJobResponse>> ToResponsesAsync(List<FreelanceJob> jobs, DateTime now, CancellationToken cancellationToken)
    {
        var jobIds = jobs.Select(j => j.Id).ToList();
        var airportIds = jobs.SelectMany(j => j.Legs).SelectMany(l => new[] { l.OriginAirportId, l.DestinationAirportId }).Distinct().ToList();

        var airports = await db.Airports.AsNoTracking()
            .Where(a => airportIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id, cancellationToken);

        var aircraft = (await db.Set<FreelanceJobAircraft>().AsNoTracking()
                .Where(a => jobIds.Contains(a.FreelanceJobId))
                .Join(db.AircraftTypes, a => a.AircraftTypeId, t => t.Id,
                    (a, t) => new { a.FreelanceJobId, t.IcaoCode, t.RangeNm, t.MinRunwayFt, t.RequiresPavedRunway })
                .ToListAsync(cancellationToken))
            .GroupBy(a => a.FreelanceJobId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(a => new AircraftLimits(a.IcaoCode, a.RangeNm, a.MinRunwayFt, a.RequiresPavedRunway))
                    .OrderBy(a => a.IcaoCode, StringComparer.Ordinal)
                    .ToList());

        return jobs.Select(job =>
            {
                var types = aircraft.GetValueOrDefault(job.Id, []);
                var legs = job.Legs.OrderBy(l => l.Sequence).ToList();
                var first = airports[legs[0].OriginAirportId];
                var last = airports[legs[^1].DestinationAirportId];

                var warnings = legs
                    .SelectMany(l => RouteChecks.Warnings(l.DistanceNm, Runways(airports[l.OriginAirportId]), Runways(airports[l.DestinationAirportId]), types))
                    .Distinct()
                    .ToList();

                return new FreelanceJobResponse(
                    job.Id,
                    job.Kind.ToString(),
                    AirportCodes.Display(first), first.IataCode, first.Name,
                    AirportCodes.Display(last), last.IataCode, last.Name,
                    job.DistanceNm,
                    job.Client,
                    job.Briefing,
                    legs.Select(l => ToLeg(l, airports[l.OriginAirportId], airports[l.DestinationAirportId])).ToList(),
                    job.Reward,
                    DateTime.SpecifyKind(job.ExpiresAtUtc, DateTimeKind.Utc),
                    job.IsExpired(now),
                    types.Select(t => t.IcaoCode).ToList(),
                    warnings);
            })
            .ToList();
    }

    private static FreelanceLegResponse ToLeg(FreelanceJobLeg leg, Airport origin, Airport destination) =>
        new(leg.Sequence,
            AirportCodes.Display(origin), origin.IataCode, origin.Name,
            AirportCodes.Display(destination), destination.IataCode, destination.Name,
            leg.DistanceNm,
            leg.PassengerCount,
            leg.PassengerNames,
            leg.CargoKg,
            leg.DangerousGoods.Select(g => new DangerousGoodResponse(g.Name, g.Class.ToString(), g.QuantityKg, g.UnNumber)).ToList());

    private static AirportRunways Runways(Airport airport) =>
        new(AirportCodes.Display(airport), airport.LongestRunwayFt, airport.LongestHardRunwayFt);
}