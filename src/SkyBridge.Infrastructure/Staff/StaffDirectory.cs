using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Common;
using SkyBridge.Application.Staff;
using SkyBridge.Domain.Pireps;
using SkyBridge.Domain.Staff;
using SkyBridge.Domain.Users;
using SkyBridge.Infrastructure.Auth;
using SkyBridge.Infrastructure.Identity;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Staff;

internal sealed class StaffDirectory(SkyBridgeDbContext db, UserManager<ApplicationUser> userManager, TimeProvider time) : IStaffDirectory
{
    public const int MaxCandidates = 10;

    public async Task<IReadOnlyList<StaffMemberResponse>> ListAsync(CancellationToken cancellationToken)
    {
        var rows = await (
                from member in db.StaffMembers.AsNoTracking()
                join user in db.Users.AsNoTracking() on member.UserId equals user.Id
                select new { member, user.FirstName, user.LastName, user.Email })
            .ToListAsync(cancellationToken);

        return rows
            .OrderBy(r => r.member.Department)
            .ThenBy(r => r.member.SortOrder)
            .ThenBy(r => r.FirstName)
            .Select(r => ToResponse(r.member, r.FirstName, r.LastName, r.Email!))
            .ToList();
    }

    public async Task<IReadOnlyList<StaffCandidateResponse>> SearchCandidatesAsync(string? search, CancellationToken cancellationToken)
    {
        var term = search?.Trim();
        if (string.IsNullOrEmpty(term) || term.Length < 2)
            return [];

        var users = await db.Users.AsNoTracking()
            .Where(u => u.Email!.Contains(term) || (u.FirstName + " " + u.LastName).Contains(term))
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .Take(MaxCandidates)
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email })
            .ToListAsync(cancellationToken);

        var ids = users.Select(u => u.Id).ToList();
        var staff = await db.StaffMembers.AsNoTracking().Where(m => ids.Contains(m.UserId)).Select(m => m.UserId).ToListAsync(cancellationToken);

        return users.Select(u => new StaffCandidateResponse(u.Id, FullName(u.FirstName, u.LastName), u.Email!, staff.Contains(u.Id))).ToList();
    }

    public async Task<Result<StaffMemberResponse>> SaveAsync(Guid userId, StaffMemberRequest request, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Department))
            return Result<StaffMemberResponse>.Invalid(nameof(request.Department), "Choose a department.");
        var position = request.Position?.Trim() ?? string.Empty;
        if (position.Length is < StaffMember.MinPositionLength or > StaffMember.MaxPositionLength)
            return Result<StaffMemberResponse>.Invalid(nameof(request.Position),
                $"The position has {StaffMember.MinPositionLength} to {StaffMember.MaxPositionLength} characters.");
        if (request.SortOrder is < 0 or > StaffMember.MaxSortOrder)
            return Result<StaffMemberResponse>.Invalid(nameof(request.SortOrder), $"The order goes from 0 to {StaffMember.MaxSortOrder}.");

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<StaffMemberResponse>.NotFound();

        var member = await db.StaffMembers.FirstOrDefaultAsync(m => m.UserId == userId, cancellationToken);
        if (member is null)
        {
            member = StaffMember.Create(userId, position, request.Department, request.SortOrder, request.PanelAccess, time.GetUtcNow().UtcDateTime);
            db.StaffMembers.Add(member);
        }
        else
        {
            member.Update(position, request.Department, request.SortOrder, request.PanelAccess);
        }

        await db.SaveChangesAsync(cancellationToken);
        await SyncPanelAccessAsync(user, member.PanelAccess);

        return Result<StaffMemberResponse>.Ok(ToResponse(member, user.FirstName, user.LastName, user.Email!));
    }

    public async Task<Result<bool>> RemoveAsync(Guid userId, CancellationToken cancellationToken)
    {
        var member = await db.StaffMembers.FirstOrDefaultAsync(m => m.UserId == userId, cancellationToken);
        if (member is null)
            return Result<bool>.NotFound();

        db.StaffMembers.Remove(member);
        await db.SaveChangesAsync(cancellationToken);

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is not null)
            await SyncPanelAccessAsync(user, false);

        return Result<bool>.Ok(true);
    }

    public async Task<IReadOnlyList<PublicStaffResponse>> PublicListAsync(CancellationToken cancellationToken)
    {
        var rows = await (
                from member in db.StaffMembers.AsNoTracking()
                join user in db.Users.AsNoTracking() on member.UserId equals user.Id
                select new { member, user.FirstName, user.LastName })
            .ToListAsync(cancellationToken);
        if (rows.Count == 0)
            return [];

        var ids = rows.Select(r => r.member.UserId).ToList();
        var flights = await db.Pireps.AsNoTracking()
            .Where(p => ids.Contains(p.PilotUserId) && p.Status == PirepStatus.Accepted)
            .GroupBy(p => p.PilotUserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.UserId, g => g.Count, cancellationToken);
        var minutes = await db.Pilots.AsNoTracking()
            .Where(p => ids.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, p => p.FlightMinutes, cancellationToken);
        var avatars = await db.UserImages.AsNoTracking()
            .Where(i => ids.Contains(i.UserId) && i.Kind == UserImageKind.Avatar)
            .ToDictionaryAsync(i => i.UserId, i => i.UpdatedAtUtc, cancellationToken);

        return rows
            .OrderBy(r => r.member.Department)
            .ThenBy(r => r.member.SortOrder)
            .ThenBy(r => r.FirstName)
            .Select(r => new PublicStaffResponse(
                r.member.UserId,
                FullName(r.FirstName, r.LastName),
                r.member.Position,
                r.member.Department,
                CurrentUserReader.AvatarUrl(r.member.UserId, avatars.TryGetValue(r.member.UserId, out var updatedAt) ? updatedAt : null),
                flights.GetValueOrDefault(r.member.UserId),
                minutes.GetValueOrDefault(r.member.UserId),
                DateTime.SpecifyKind(r.member.JoinedAtUtc, DateTimeKind.Utc)))
            .ToList();
    }

    private async Task SyncPanelAccessAsync(ApplicationUser user, bool panelAccess)
    {
        var hasRole = await userManager.IsInRoleAsync(user, Roles.Staff);
        if (panelAccess && !hasRole)
            await userManager.AddToRoleAsync(user, Roles.Staff);
        else if (!panelAccess && hasRole)
            await userManager.RemoveFromRoleAsync(user, Roles.Staff);
    }

    private static StaffMemberResponse ToResponse(StaffMember member, string firstName, string lastName, string email) =>
        new(member.UserId, FullName(firstName, lastName), email, member.Position, member.Department, member.SortOrder, member.PanelAccess);

    private static string FullName(string firstName, string lastName) => $"{firstName} {lastName}".Trim();
}