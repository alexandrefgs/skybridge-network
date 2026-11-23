namespace SkyBridge.Domain.Bookings;

public sealed class Booking
{
    private Booking() { }

    public int Id { get; private set; }
    public Guid PilotUserId { get; private set; }
    public BookingSource Source { get; private set; }
    public int? FreelanceJobId { get; private set; }
    public int AircraftTypeId { get; private set; }
    public BookingStatus Status { get; private set; }
    public int LegCount { get; private set; }
    public int CurrentLeg { get; private set; }
    public int Reward { get; private set; }
    public DateTime BookedAtUtc { get; private set; }
    public DateTime StartDeadlineUtc { get; private set; }
    public DateTime? StartedAtUtc { get; private set; }
    public DateTime? LegStartedAtUtc { get; private set; }
    public DateTime? FinishedAtUtc { get; private set; }
    public DateTime? RewardPaidAtUtc { get; private set; }

    public bool LegInProgress => LegStartedAtUtc is not null;

    public static Booking ForFreelanceJob(Guid pilotUserId, int freelanceJobId, int aircraftTypeId, int legCount, int reward,
        DateTime startDeadlineUtc, DateTime nowUtc)
    {
        if (pilotUserId == Guid.Empty)
            throw new ArgumentException("Booking needs a pilot.", nameof(pilotUserId));
        ArgumentOutOfRangeException.ThrowIfLessThan(legCount, 1);
        ArgumentOutOfRangeException.ThrowIfNegative(reward);
        if (startDeadlineUtc <= nowUtc)
            throw new InvalidOperationException("This job has already expired.");

        return new Booking
        {
            PilotUserId = pilotUserId,
            Source = BookingSource.Freelance,
            FreelanceJobId = freelanceJobId,
            AircraftTypeId = aircraftTypeId,
            Status = BookingStatus.Active,
            LegCount = legCount,
            Reward = reward,
            CurrentLeg = 1,
            BookedAtUtc = nowUtc,
            StartDeadlineUtc = startDeadlineUtc
        };
    }

    public bool IsOverdue(DateTime nowUtc) =>
        Status == BookingStatus.Active && StartedAtUtc is null && nowUtc >= StartDeadlineUtc;

    public void StartLeg(DateTime nowUtc)
    {
        if (Status != BookingStatus.Active)
            throw new InvalidOperationException("This booking is no longer active.");
        if (LegInProgress)
            throw new InvalidOperationException($"Leg {CurrentLeg} is already in progress.");
        if (IsOverdue(nowUtc))
            throw new InvalidOperationException("The deadline to start this flight has passed.");

        StartedAtUtc ??= nowUtc;
        LegStartedAtUtc = nowUtc;
    }
    public void CompleteLeg(DateTime nowUtc)
    {
        if (Status != BookingStatus.Active || !LegInProgress)
            throw new InvalidOperationException("Start the leg before filing the PIREP.");

        LegStartedAtUtc = null;
        if (CurrentLeg < LegCount)
        {
            CurrentLeg++;
            return;
        }

        Status = BookingStatus.Completed;
        FinishedAtUtc = nowUtc;
    }

    public void MarkRewardPaid(DateTime nowUtc)
    {
        if (Status != BookingStatus.Completed)
            throw new InvalidOperationException("The reward is paid after the last leg.");
        if (RewardPaidAtUtc is not null)
            throw new InvalidOperationException("The reward was already paid.");

        RewardPaidAtUtc = nowUtc;
    }

    public void Cancel(DateTime nowUtc)
    {
        if (Status != BookingStatus.Active)
            throw new InvalidOperationException("This booking is no longer active.");

        Status = BookingStatus.Cancelled;
        LegStartedAtUtc = null;
        FinishedAtUtc = nowUtc;
    }

    public void Expire(DateTime nowUtc)
    {
        if (!IsOverdue(nowUtc))
            throw new InvalidOperationException("Only a booking that missed its start can expire.");

        Status = BookingStatus.Expired;
        FinishedAtUtc = nowUtc;
    }
}