using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Common;
using SkyBridge.Application.Freelance;
using SkyBridge.Domain.Users;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize(Roles = $"{Roles.Admin},{Roles.Staff}")]
[Route("api/admin/freelance")]
public class AdminFreelanceController(IFreelanceQueries queries, IFreelanceAdmin admin) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<FreelanceJobResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] string? from,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await queries.SearchAsync(new FreelanceJobSearch(from, true, page, pageSize), cancellationToken));

    [HttpPost]
    [ProducesResponseType<FreelanceJobResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(FreelanceJobRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await admin.CreateAsync(request, cancellationToken),
            job => Created($"/api/freelance/{job.Id}", job));

    [HttpPut("{id:int}")]
    [ProducesResponseType<FreelanceJobResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, FreelanceJobRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await admin.UpdateAsync(id, request, cancellationToken), Ok);

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken) =>
        await admin.DeleteAsync(id, cancellationToken) ? NoContent() : NotFound();
}