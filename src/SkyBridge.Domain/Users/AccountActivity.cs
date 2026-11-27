namespace SkyBridge.Domain.Users;

public enum AccountStatus
{
    Active = 1,
    Inactive = 2,
    Reactivating = 3
}

public sealed record AccountActivity(DateTime LastActiveAtUtc, DateTime? DeactivatedAtUtc, DateTime? ReactivationReadyAtUtc)
{
    public static readonly TimeSpan InactiveAfter = TimeSpan.FromDays(60);
    public static readonly TimeSpan ReactivationDelay = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan RetainFor = TimeSpan.FromDays(365);
    public static readonly TimeSpan TouchInterval = TimeSpan.FromHours(1);

    public AccountStatus StatusAt(DateTime nowUtc)
    {
        if (ReactivationReadyAtUtc is { } ready)
            return nowUtc < ready ? AccountStatus.Reactivating : AccountStatus.Active;
        if (DeactivatedAtUtc is not null || nowUtc - LastActiveAtUtc > InactiveAfter)
            return AccountStatus.Inactive;
        return AccountStatus.Active;
    }

    public AccountActivity Touch(DateTime nowUtc)
    {
        if (ReactivationReadyAtUtc is { } ready && nowUtc >= ready)
            return new AccountActivity(nowUtc, null, null);

        return StatusAt(nowUtc) switch
        {
            AccountStatus.Inactive when DeactivatedAtUtc is null => this with { DeactivatedAtUtc = nowUtc },
            AccountStatus.Active when nowUtc - LastActiveAtUtc >= TouchInterval => this with { LastActiveAtUtc = nowUtc },
            _ => this
        };
    }

    public AccountActivity StartReactivation(DateTime nowUtc)
    {
        if (StatusAt(nowUtc) != AccountStatus.Inactive)
            throw new InvalidOperationException("Only an inactive account can be reactivated.");

        return this with { DeactivatedAtUtc = DeactivatedAtUtc ?? nowUtc, ReactivationReadyAtUtc = nowUtc + ReactivationDelay };
    }

    public bool ExpiredAt(DateTime nowUtc) => nowUtc - LastActiveAtUtc > RetainFor;
}