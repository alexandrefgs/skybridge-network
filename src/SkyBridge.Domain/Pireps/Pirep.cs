namespace SkyBridge.Domain.Pireps;

public sealed class Pirep
{
    public const int MaxRemarksLength = 500;
    public const int MaxNoteLength = 300;
    public const int MaxFlightMinutes = 24 * 60;
    public const int MaxLandingRateFpm = 5000;
    public static readonly TimeSpan ClockTolerance = TimeSpan.FromMinutes(5);
    public static readonly TimeSpan EarlyTakeoffTolerance = TimeSpan.FromMinutes(30);
    public const double MinimumSpeedRatio = 0.7;

    private Pirep() { }

    public int Id { get; private set; }
    public int BookingId { get; private set; }
    public Guid PilotUserId { get; private set; }
    public int LegSequence { get; private set; }
    public int OriginAirportId { get; private set; }
    public int DestinationAirportId { get; private set; }
    public int AircraftTypeId { get; private set; }
    public int DistanceNm { get; private set; }
    public DateTime DepartedAtUtc { get; private set; }
    public DateTime ArrivedAtUtc { get; private set; }
    public int FlightMinutes { get; private set; }
    public int? FuelUsedKg { get; private set; }
    public int? LandingRateFpm { get; private set; }
    public string? Remarks { get; private set; }
    public PirepStatus Status { get; private set; }
    public string? Flag { get; private set; }
    public string? ReviewNote { get; private set; }
    public DateTime FiledAtUtc { get; private set; }
    public DateTime? ReviewedAtUtc { get; private set; }

    public static Pirep File(PirepLeg leg, PirepTimes times, DateTime nowUtc)
    {
        if (times.ArrivedAtUtc <= times.DepartedAtUtc)
            throw new ArgumentException("Landing must be after takeoff.", nameof(times));
        if (times.ArrivedAtUtc > nowUtc + ClockTolerance)
            throw new ArgumentException("Landing time can't be in the future.", nameof(times));

        var minutes = (int)Math.Round((times.ArrivedAtUtc - times.DepartedAtUtc).TotalMinutes);
        if (minutes < 1)
            throw new ArgumentException("The flight must last at least one minute.", nameof(times));
        if (minutes > MaxFlightMinutes)
            throw new ArgumentException("A leg can't last more than 24 hours.", nameof(times));
        if (times.FuelUsedKg is < 0)
            throw new ArgumentException("Fuel used can't be negative.", nameof(times));
        if (times.LandingRateFpm is < 0 or > MaxLandingRateFpm)
            throw new ArgumentException($"Landing rate must be between 0 and {MaxLandingRateFpm} fpm.", nameof(times));

        var remarks = string.IsNullOrWhiteSpace(times.Remarks) ? null : times.Remarks.Trim();
        if (remarks?.Length > MaxRemarksLength)
            throw new ArgumentException($"Remarks must have at most {MaxRemarksLength} characters.", nameof(times));

        var flag = FlagFor(leg, times, minutes);

        return new Pirep
        {
            BookingId = leg.BookingId,
            PilotUserId = leg.PilotUserId,
            LegSequence = leg.Sequence,
            OriginAirportId = leg.OriginAirportId,
            DestinationAirportId = leg.DestinationAirportId,
            AircraftTypeId = leg.AircraftTypeId,
            DistanceNm = leg.DistanceNm,
            DepartedAtUtc = times.DepartedAtUtc,
            ArrivedAtUtc = times.ArrivedAtUtc,
            FlightMinutes = minutes,
            FuelUsedKg = times.FuelUsedKg,
            LandingRateFpm = times.LandingRateFpm,
            Remarks = remarks,
            Status = flag is null ? PirepStatus.Accepted : PirepStatus.Pending,
            Flag = flag,
            FiledAtUtc = nowUtc
        };
    }

    public static int ExpectedMinutes(int distanceNm, int cruiseSpeedKts) =>
        cruiseSpeedKts <= 0 ? 0 : (int)Math.Round(distanceNm * 60.0 / cruiseSpeedKts);

    public void Approve(DateTime nowUtc, string? note)
    {
        EnsurePending();
        Status = PirepStatus.Accepted;
        ReviewNote = Note(note);
        ReviewedAtUtc = nowUtc;
    }

    public void Reject(DateTime nowUtc, string note)
    {
        EnsurePending();
        ReviewNote = Note(note) ?? throw new ArgumentException("Tell the pilot why the PIREP was rejected.", nameof(note));
        Status = PirepStatus.Rejected;
        ReviewedAtUtc = nowUtc;
    }

    private static string? FlagFor(PirepLeg leg, PirepTimes times, int minutes)
    {
        if (times.DepartedAtUtc < leg.LegStartedAtUtc - EarlyTakeoffTolerance)
            return "Takeoff is before the leg was started.";

        var expected = ExpectedMinutes(leg.DistanceNm, leg.CruiseSpeedKts);
        if (minutes < expected * MinimumSpeedRatio)
            return $"{minutes} min is too short for {leg.DistanceNm} nm in a {leg.AircraftCode} (about {expected} min expected).";

        return null;
    }

    private void EnsurePending()
    {
        if (Status != PirepStatus.Pending)
            throw new InvalidOperationException("Only pending PIREPs can be reviewed.");
    }

    private static string? Note(string? note)
    {
        if (string.IsNullOrWhiteSpace(note))
            return null;

        note = note.Trim();
        return note.Length > MaxNoteLength
            ? throw new ArgumentException($"Note must have at most {MaxNoteLength} characters.", nameof(note))
            : note;
    }
}