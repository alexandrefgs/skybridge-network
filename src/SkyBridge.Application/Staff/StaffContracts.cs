using System.ComponentModel.DataAnnotations;
using SkyBridge.Application.Common;
using SkyBridge.Domain.Staff;

namespace SkyBridge.Application.Staff;

public sealed record StaffMemberRequest(
    [Required, StringLength(StaffMember.MaxPositionLength, MinimumLength = StaffMember.MinPositionLength)] string Position,
    StaffDepartment Department,
    [Range(0, StaffMember.MaxSortOrder)] int SortOrder,
    bool PanelAccess);

public sealed record StaffMemberResponse(
    Guid UserId,
    string Name,
    string Email,
    string Position,
    StaffDepartment Department,
    int SortOrder,
    bool PanelAccess);

public sealed record StaffCandidateResponse(Guid UserId, string Name, string Email, bool IsStaff);

public sealed record PublicStaffResponse(
    Guid UserId,
    string Name,
    string Position,
    StaffDepartment Department,
    string? AvatarUrl,
    int Flights,
    int FlightMinutes,
    DateTime JoinedAtUtc);

public interface IStaffDirectory
{
    Task<IReadOnlyList<StaffMemberResponse>> ListAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<StaffCandidateResponse>> SearchCandidatesAsync(string? search, CancellationToken cancellationToken);
    Task<Result<StaffMemberResponse>> SaveAsync(Guid userId, StaffMemberRequest request, CancellationToken cancellationToken);
    Task<Result<bool>> RemoveAsync(Guid userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<PublicStaffResponse>> PublicListAsync(CancellationToken cancellationToken);
}