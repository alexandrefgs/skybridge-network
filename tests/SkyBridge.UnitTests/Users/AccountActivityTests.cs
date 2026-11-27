using SkyBridge.Domain.Users;

namespace SkyBridge.UnitTests.Users;

public class AccountActivityTests
{
    private static readonly DateTime Now = new(2026, 11, 27, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Status_IsActive_UntilSixtyDaysWithoutActivity()
    {
        Assert.Equal(AccountStatus.Active, new AccountActivity(Now.AddDays(-60), null, null).StatusAt(Now));
        Assert.Equal(AccountStatus.Inactive, new AccountActivity(Now.AddDays(-60).AddMinutes(-1), null, null).StatusAt(Now));
    }

    [Fact]
    public void Touch_RecordsActivity_AtMostOncePerHour()
    {
        var recent = new AccountActivity(Now.AddMinutes(-30), null, null);
        var older = new AccountActivity(Now.AddHours(-2), null, null);

        Assert.Same(recent, recent.Touch(Now));
        Assert.Equal(Now, older.Touch(Now).LastActiveAtUtc);
    }

    [Fact]
    public void Touch_MarksAnIdleAccountAsInactive_WithoutRefreshingIt()
    {
        var idle = new AccountActivity(Now.AddDays(-90), null, null);

        var touched = idle.Touch(Now);

        Assert.Equal((AccountStatus.Inactive, Now, Now.AddDays(-90)), (touched.StatusAt(Now), touched.DeactivatedAtUtc!.Value, touched.LastActiveAtUtc));
        Assert.Same(touched, touched.Touch(Now.AddDays(1)));
    }

    [Fact]
    public void Reactivation_TakesTenMinutes_ThenTheAccountIsActiveAgain()
    {
        var inactive = new AccountActivity(Now.AddDays(-90), Now.AddDays(-1), null);

        var preparing = inactive.StartReactivation(Now);

        Assert.Equal(AccountStatus.Reactivating, preparing.StatusAt(Now.AddMinutes(9)));
        Assert.Same(preparing, preparing.Touch(Now.AddMinutes(9)));
        var active = preparing.Touch(Now.AddMinutes(10));
        Assert.Equal(new AccountActivity(Now.AddMinutes(10), null, null), active);
        Assert.Equal(AccountStatus.Active, active.StatusAt(Now.AddMinutes(10)));
    }

    [Fact]
    public void StartReactivation_IsOnlyForInactiveAccounts()
    {
        var active = new AccountActivity(Now, null, null);

        Assert.Throws<InvalidOperationException>(() => active.StartReactivation(Now));
    }

    [Fact]
    public void ExpiredAt_AfterTwelveMonthsWithoutActivity()
    {
        Assert.False(new AccountActivity(Now.AddDays(-365), null, null).ExpiredAt(Now));
        Assert.True(new AccountActivity(Now.AddDays(-366), null, null).ExpiredAt(Now));
    }
}