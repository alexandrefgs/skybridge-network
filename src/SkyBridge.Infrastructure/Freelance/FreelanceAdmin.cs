using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Common;
using SkyBridge.Application.Freelance;
using SkyBridge.Domain.Freelance;
using SkyBridge.Infrastructure.Airports;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Freelance;

internal sealed class FreelanceAdmin(SkyBridgeDbContext db, IFreelanceQueries queries, TimeProvider time) : IFreelanceAdmin
{
    public async Task<Result<FreelanceJobResponse>> CreateAsync(FreelanceJobRequest request, CancellationToken cancellationToken)
    {
        var input = await ValidateAsync(request, cancellationToken);
        if (input.Error is not null)
            return input.Error;

        var job = FreelanceJob.Create(input.Details!, input.Legs!, input.AircraftIds!, time.GetUtcNow().UtcDateTime);
        db.FreelanceJobs.Add(job);
        await db.SaveChangesAsync(cancellationToken);

        return Result<FreelanceJobResponse>.Ok((await queries.GetAsync(job.Id, cancellationToken))!);
    }

    public async Task<Result<FreelanceJobResponse>> UpdateAsync(int id, FreelanceJobRequest request, CancellationToken cancellationToken)
    {
        var job = await db.FreelanceJobs
            .Include(j => j.Aircraft)
            .Include(j => j.Legs)
            .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
        if (job is null)
            return Result<FreelanceJobResponse>.NotFound();

        var input = await ValidateAsync(request, cancellationToken);
        if (input.Error is not null)
            return input.Error;

        job.Update(input.Details!, input.Legs!, input.AircraftIds!, time.GetUtcNow().UtcDateTime);
        await db.SaveChangesAsync(cancellationToken);

        return Result<FreelanceJobResponse>.Ok((await queries.GetAsync(job.Id, cancellationToken))!);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) =>
        await db.FreelanceJobs.Where(j => j.Id == id).ExecuteDeleteAsync(cancellationToken) > 0;

    private async Task<ValidatedJob> ValidateAsync(FreelanceJobRequest request, CancellationToken cancellationToken)
    {
        var legRequests = request.Legs ?? [];
        if (legRequests.Count is 0 or > FreelanceJob.MaxLegs)
            return Fail(nameof(request.Legs), $"A job needs between 1 and {FreelanceJob.MaxLegs} legs.");

        var airports = await AirportCodes.FindAsync(db, legRequests.SelectMany(l => new[] { l.Origin, l.Destination }), cancellationToken);
        var legs = new List<FreelanceLegPlan>();

        for (var i = 0; i < legRequests.Count; i++)
        {
            var leg = legRequests[i];
            var number = i + 1;

            if (!airports.TryGetValue(AirportCodes.Normalize(leg.Origin), out var origin))
                return Fail(nameof(request.Legs), $"Leg {number}: airport '{AirportCodes.Normalize(leg.Origin)}' was not found.");
            if (!airports.TryGetValue(AirportCodes.Normalize(leg.Destination), out var destination))
                return Fail(nameof(request.Legs), $"Leg {number}: airport '{AirportCodes.Normalize(leg.Destination)}' was not found.");
            if (origin.Id == destination.Id && request.Kind != FreelanceJobKind.Skydiving)
                return Fail(nameof(request.Legs), $"Leg {number}: origin and destination must be different airports.");
            if (i > 0 && legs[i - 1].Destination.Id != origin.Id)
                return Fail(nameof(request.Legs), $"Leg {number} must depart from {AirportCodes.Display(legs[i - 1].Destination)}, where leg {i} lands.");

            var names = (leg.PassengerNames ?? []).Where(n => !string.IsNullOrWhiteSpace(n)).ToList();
            if (names.Count > leg.PassengerCount)
                return Fail(nameof(request.Legs), $"Leg {number}: there are more passenger names than passengers.");
            if (names.Count > FreelanceJobLeg.MaxNamedPassengers)
                return Fail(nameof(request.Legs), $"Leg {number}: list at most {FreelanceJobLeg.MaxNamedPassengers} passengers by name.");
            if (names.Any(n => n.Trim().Length > FreelanceJobLeg.MaxPassengerNameLength))
                return Fail(nameof(request.Legs), $"Leg {number}: passenger names must have at most {FreelanceJobLeg.MaxPassengerNameLength} characters.");

            var goodsRequest = leg.DangerousGoods ?? [];
            if (goodsRequest.Count > FreelanceJobLeg.MaxDangerousGoods)
                return Fail(nameof(request.Legs), $"Leg {number}: list at most {FreelanceJobLeg.MaxDangerousGoods} dangerous goods.");

            var goods = new List<DangerousGood>();
            foreach (var good in goodsRequest)
            {
                try
                {
                    goods.Add(DangerousGood.Create(good.Name, good.Class, good.QuantityKg, good.UnNumber));
                }
                catch (ArgumentException exception)
                {
                    return Fail(nameof(request.Legs), $"Leg {number}: {exception.Message.Split(" (Parameter")[0]}");
                }
            }

            legs.Add(new FreelanceLegPlan(origin, destination, leg.PassengerCount, names, leg.CargoKg, goods));
        }

        var wanted = (request.Aircraft ?? [])
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code.Trim().ToUpperInvariant())
            .Distinct()
            .ToList();
        if (wanted.Count == 0)
            return Fail(nameof(request.Aircraft), "Choose at least one aircraft type.");

        var types = await db.AircraftTypes.AsNoTracking()
            .Where(t => wanted.Contains(t.IcaoCode))
            .Select(t => new { t.Id, t.IcaoCode })
            .ToListAsync(cancellationToken);
        var unknown = wanted.Except(types.Select(t => t.IcaoCode)).ToList();
        if (unknown.Count > 0)
            return Fail(nameof(request.Aircraft), $"{string.Join(", ", unknown)} {(unknown.Count == 1 ? "is" : "are")} not in the catalog.");

        var expires = DateTime.SpecifyKind(request.ExpiresAtUtc.ToUniversalTime(), DateTimeKind.Utc);
        if (expires <= time.GetUtcNow().UtcDateTime)
            return Fail(nameof(request.ExpiresAtUtc), "The job must expire in the future.");

        var details = new FreelanceJobDetails(request.Kind, request.Client, request.Briefing, request.Reward, expires);
        return new ValidatedJob(details, legs, types.Select(t => t.Id).ToList(), null);
    }

    private static ValidatedJob Fail(string field, string message) =>
        new(null, null, null, Result<FreelanceJobResponse>.Invalid(field, message));

    private sealed record ValidatedJob(
        FreelanceJobDetails? Details,
        List<FreelanceLegPlan>? Legs,
        List<int>? AircraftIds,
        Result<FreelanceJobResponse>? Error);
}