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

        var pireps = await db.Pireps.Where(p => p.BookingId == booking.Id)
            .Select(p => new { p.Status, p.FlightMinutes })
            .ToListAsync(cancellationToken);
        if (pireps.Count < booking.LegCount || pireps.Any(p => p.Status != PirepStatus.Accepted))
            return null;

        var minutes = pireps.Sum(p => p.FlightMinutes);
        var amount = booking.Source == BookingSource.Airline ? booking.PayFor(minutes) : booking.Reward;

        booking.MarkRewardPaid(nowUtc);
        if (amount > 0)
        {
            pilot.Credit(amount);
            db.PilotTransactions.Add(PilotTransaction.Create(pilot.UserId, amount, Description(booking, minutes), booking.Id, nowUtc));
        }

        await db.SaveChangesAsync(cancellationToken);
        return amount;
    }

    private static string Description(Booking booking, int minutes)
    {
        if (booking.Source == BookingSource.Airline)
            return $"Flight {booking.FlightNumber} · {minutes / 60}h{minutes % 60:00}min at ${booking.PayPerHour}/h";

        return booking.FreelanceJobId is { } jobId ? $"Freelance job #{jobId} completed" : "Freelance job completed";
    }
}