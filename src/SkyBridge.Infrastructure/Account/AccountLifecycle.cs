using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Account;
using SkyBridge.Application.Common;
using SkyBridge.Application.Legal;
using SkyBridge.Domain.Users;
using SkyBridge.Infrastructure.Identity;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Account;

internal sealed class AccountLifecycle(SkyBridgeDbContext db, UserManager<ApplicationUser> userManager, TimeProvider time) : IAccountLifecycle
{
    public async Task<AccountStatusResponse?> GetStatusAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return null;

        var now = Now();
        var activity = Activity(user);
        var touched = activity.Touch(now);
        if (touched != activity)
        {
            Apply(user, touched);
            await userManager.UpdateAsync(user);
        }

        return ToResponse(user, touched, now);
    }

    public async Task<Result<AccountStatusResponse>> ReactivateAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<AccountStatusResponse>.NotFound();

        var now = Now();
        var activity = Activity(user).Touch(now);
        var status = activity.StatusAt(now);
        if (status != AccountStatus.Inactive)
            return Result<AccountStatusResponse>.Conflict("Status", status == AccountStatus.Reactivating
                ? "Your account is already being prepared."
                : "Your account is already active.");

        var reactivating = activity.StartReactivation(now);
        Apply(user, reactivating);
        await userManager.UpdateAsync(user);
        return Result<AccountStatusResponse>.Ok(ToResponse(user, reactivating, now));
    }

    public async Task<Result<AccountStatusResponse>> AcceptRegulationsAsync(Guid userId, AcceptRegulationsRequest request, CancellationToken cancellationToken)
    {
        var current = RegulationsCatalog.Current.Version;
        if (request.Version != current)
            return Result<AccountStatusResponse>.Invalid(nameof(request.Version), $"Accept the current version of the regulations ({current}).");

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<AccountStatusResponse>.NotFound();

        var now = Now();
        user.AcceptedRegulationsVersion = current;
        user.RegulationsAcceptedAtUtc = now;
        await userManager.UpdateAsync(user);
        return Result<AccountStatusResponse>.Ok(ToResponse(user, Activity(user), now));
    }

    public async Task<Result<bool>> DeleteAsync(Guid userId, DeleteAccountRequest request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<bool>.NotFound();

        if (await userManager.IsInRoleAsync(user, Roles.Admin))
            return Result<bool>.Conflict("Account", "Admin accounts can't be deleted here. Remove the Admin role first.");

        if (!await userManager.CheckPasswordAsync(user, request.Password ?? string.Empty))
            return Result<bool>.Invalid(nameof(request.Password), "Wrong password.");

        var deleted = await userManager.DeleteAsync(user);
        return deleted.Succeeded
            ? Result<bool>.Ok(true)
            : Result<bool>.Conflict("Account", deleted.Errors.FirstOrDefault()?.Description ?? "The account could not be deleted.");
    }

    public async Task<int> PurgeExpiredAsync(CancellationToken cancellationToken)
    {
        var cutoff = Now() - AccountActivity.RetainFor;
        var adminRoleId = await db.Roles.Where(r => r.Name == Roles.Admin).Select(r => r.Id).FirstOrDefaultAsync(cancellationToken);
        var expired = await db.Users
            .Where(u => u.LastActiveAtUtc < cutoff && !db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == adminRoleId))
            .ToListAsync(cancellationToken);

        var purged = 0;
        foreach (var user in expired)
        {
            if ((await userManager.DeleteAsync(user)).Succeeded)
                purged++;
        }

        return purged;
    }

    private DateTime Now() => time.GetUtcNow().UtcDateTime;

    private static AccountActivity Activity(ApplicationUser user) =>
        new(user.LastActiveAtUtc, user.DeactivatedAtUtc, user.ReactivationReadyAtUtc);

    private static void Apply(ApplicationUser user, AccountActivity activity)
    {
        user.LastActiveAtUtc = activity.LastActiveAtUtc;
        user.DeactivatedAtUtc = activity.DeactivatedAtUtc;
        user.ReactivationReadyAtUtc = activity.ReactivationReadyAtUtc;
    }

    private static AccountStatusResponse ToResponse(ApplicationUser user, AccountActivity activity, DateTime now) =>
        new(
            activity.StatusAt(now),
            activity.ReactivationReadyAtUtc is { } ready ? DateTime.SpecifyKind(ready, DateTimeKind.Utc) : null,
            user.AcceptedRegulationsVersion,
            RegulationsCatalog.Current.Version,
            RegulationsCatalog.Since(user.AcceptedRegulationsVersion));
}