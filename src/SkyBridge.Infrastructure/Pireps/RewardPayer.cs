using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Bookings;
using SkyBridge.Domain.Pilots;
using SkyBridge.Domain.Pireps;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Pireps;

internal sealed class RewardPayer(SkyBridgeDbContext db)
{
    public async Task<int?> PayIfDueAsync(Booking booking, Pilot pilot, DateTime nowUtc, CancellationToken cancellationToken)
    {
        if (booking.Status != BookingStatus.Completed || booking.RewardPaidAtUtc is not null)
            return null;

        var statuses = await db.Pireps.Where(p => p.BookingId == booking.Id).Select(p => p.Status).ToListAsync(cancellationToken);
        if (statuses.Count < booking.LegCount || statuses.Any(s => s != PirepStatus.Accepted))
            return null;

        booking.MarkRewardPaid(nowUtc);
        if (booking.Reward > 0)
        {
            pilot.Credit(booking.Reward);
            var description = booking.FreelanceJobId is { } jobId ? $"Freelance job #{jobId} completed" : "Freelance job completed";
            db.PilotTransactions.Add(PilotTransaction.Create(pilot.UserId, booking.Reward, description, booking.Id, nowUtc));
        }

        await db.SaveChangesAsync(cancellationToken);
        return booking.Reward;
    }
}