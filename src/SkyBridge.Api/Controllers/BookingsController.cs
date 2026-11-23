using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Bookings;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bookings")]
public class BookingsController(IBookingService bookings) : ControllerBase
{
    [HttpGet("current")]
    [ProducesResponseType<BookingResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Current(CancellationToken cancellationToken)
    {
        var booking = await bookings.GetCurrentAsync(User.GetUserId(), cancellationToken);
        return booking is null ? NoContent() : Ok(booking);
    }
    [HttpPost("routes/{routeId:int}")]
    [ProducesResponseType<BookingResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> BookRoute(int routeId, AcceptJobRequest request, CancellationToken cancellationToken) =>
        this.ToActionResult(await bookings.BookRouteAsync(User.GetUserId(), routeId, request, cancellationToken), Ok);

    [HttpPost("current/start")]
    [ProducesResponseType<BookingResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartLeg(CancellationToken cancellationToken) =>
        this.ToActionResult(await bookings.StartLegAsync(User.GetUserId(), cancellationToken), Ok);

    [HttpPost("current/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(CancellationToken cancellationToken) =>
        await bookings.CancelAsync(User.GetUserId(), cancellationToken) ? NoContent() : NotFound();
}