using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Staff;
using SkyBridge.Domain.Users;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize(Roles = Roles.Admin)]
[Route("api/admin/staff")]
public class AdminStaffController(IStaffDirectory staff) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<StaffMemberResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await staff.ListAsync(cancellationToken));

    [HttpGet("candidates")]
    [ProducesResponseType<IReadOnlyList<StaffCandidateResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Candidates([FromQuery] string? search, CancellationToken cancellationToken) =>
        Ok(await staff.SearchCandidatesAsync(search, cancellationToken));

    [HttpPut("{userId:guid}")]
    [ProducesResponseType<StaffMemberResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Save(Guid userId, StaffMemberRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await staff.SaveAsync(userId, request, cancellationToken), Ok);

    [HttpDelete("{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Remove(Guid userId, CancellationToken cancellationToken) =>
        this.ToActionResult(await staff.RemoveAsync(userId, cancellationToken), _ => NoContent());
}