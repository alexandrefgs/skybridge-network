using SkyBridge.Application.Common;

namespace SkyBridge.Application.Bookings;

public interface IBookingService
{
    Task<BookingResponse?> GetCurrentAsync(Guid userId, CancellationToken cancellationToken);
    Task<Result<BookingResponse>> AcceptFreelanceJobAsync(Guid userId, int jobId, AcceptJobRequest request, CancellationToken cancellationToken);
    Task<Result<BookingResponse>> BookRouteAsync(Guid userId, int routeId, AcceptJobRequest request, CancellationToken cancellationToken);
    Task<Result<BookingResponse>> ImportFlightPlanAsync(Guid userId, CancellationToken cancellationToken);
    Task<Result<BookingResponse>> StartLegAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> CancelAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> HasActiveAsync(Guid userId, CancellationToken cancellationToken);
}