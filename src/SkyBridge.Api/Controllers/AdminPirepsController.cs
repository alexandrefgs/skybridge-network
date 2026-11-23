using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Common;
using SkyBridge.Application.Pireps;
using SkyBridge.Domain.Users;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize(Roles = $"{Roles.Admin},{Roles.Staff}")]
[Route("api/admin/pireps")]
public class AdminPirepsController(IPirepReview review) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<PirepResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await review.SearchAsync(new PirepSearch(status, page, pageSize), cancellationToken));

    [HttpPost("{id:int}/approve")]
    [ProducesResponseType<PirepResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(int id, ReviewPirepRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await review.ApproveAsync(id, request, cancellationToken), Ok);

    [HttpPost("{id:int}/reject")]
    [ProducesResponseType<PirepResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reject(int id, ReviewPirepRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await review.RejectAsync(id, request, cancellationToken), Ok);
}