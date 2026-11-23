using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Common;
using SkyBridge.Application.Pireps;
using SkyBridge.Domain.Pireps;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Pireps;

internal sealed class PirepReview(SkyBridgeDbContext db, PirepMapper mapper, RewardPayer rewards, TimeProvider time) : IPirepReview
{
    public async Task<PagedResult<PirepResponse>> SearchAsync(PirepSearch search, CancellationToken cancellationToken)
    {
        var page = Math.Max(search.Page, 1);
        var pageSize = Math.Clamp(search.PageSize, 1, 100);

        var query = db.Pireps.AsNoTracking();
        if (Enum.TryParse<PirepStatus>(search.Status, true, out var status) && Enum.IsDefined(status))
            query = query.Where(p => p.Status == status);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(p => p.FiledAtUtc)
            .ThenByDescending(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<PirepResponse>(await mapper.ToResponsesAsync(items, cancellationToken), page, pageSize, total);
    }

    public async Task<Result<PirepResponse>> ApproveAsync(int id, ReviewPirepRequest request, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow().UtcDateTime;
        var pirep = await db.Pireps.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (pirep is null)
            return Result<PirepResponse>.NotFound();

        try
        {
            pirep.Approve(now, request.Note);
        }
        catch (InvalidOperationException exception)
        {
            return Result<PirepResponse>.Conflict("Pirep", exception.Message);
        }

        var pilot = await db.Pilots.FirstAsync(p => p.UserId == pirep.PilotUserId, cancellationToken);
        var booking = await db.Bookings.FirstAsync(b => b.Id == pirep.BookingId, cancellationToken);

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        pilot.LogFlight(pirep.FlightMinutes);
        await db.SaveChangesAsync(cancellationToken);
        await rewards.PayIfDueAsync(booking, pilot, now, cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Result<PirepResponse>.Ok(await mapper.ToResponseAsync(pirep, cancellationToken));
    }

    public async Task<Result<PirepResponse>> RejectAsync(int id, ReviewPirepRequest request, CancellationToken cancellationToken)
    {
        var pirep = await db.Pireps.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (pirep is null)
            return Result<PirepResponse>.NotFound();

        try
        {
            pirep.Reject(time.GetUtcNow().UtcDateTime, request.Note ?? string.Empty);
        }
        catch (InvalidOperationException exception)
        {
            return Result<PirepResponse>.Conflict("Pirep", exception.Message);
        }
        catch (ArgumentException exception)
        {
            return Result<PirepResponse>.Invalid(nameof(request.Note), exception.Message.Split(" (Parameter")[0]);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Result<PirepResponse>.Ok(await mapper.ToResponseAsync(pirep, cancellationToken));
    }
}