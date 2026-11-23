namespace SkyBridge.Domain.Pilots;

public sealed class PilotTransaction
{
    public const int MaxDescriptionLength = 200;

    private PilotTransaction() { }

    public int Id { get; private set; }
    public Guid PilotUserId { get; private set; }
    public int Amount { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public int? BookingId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static PilotTransaction Create(Guid pilotUserId, int amount, string description, int? bookingId, DateTime nowUtc)
    {
        if (pilotUserId == Guid.Empty)
            throw new ArgumentException("Transaction needs a pilot.", nameof(pilotUserId));
        if (amount == 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount can't be zero.");
        ArgumentException.ThrowIfNullOrWhiteSpace(description);

        description = description.Trim();
        if (description.Length > MaxDescriptionLength)
            throw new ArgumentException($"Description must have at most {MaxDescriptionLength} characters.", nameof(description));

        return new PilotTransaction
        {
            PilotUserId = pilotUserId,
            Amount = amount,
            Description = description,
            BookingId = bookingId,
            CreatedAtUtc = nowUtc
        };
    }
}