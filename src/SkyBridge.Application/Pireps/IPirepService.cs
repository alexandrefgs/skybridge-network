using SkyBridge.Application.Common;

namespace SkyBridge.Application.Pireps;

public interface IPirepService
{
    Task<Result<PirepFiledResponse>> FileAsync(Guid userId, FilePirepRequest request, CancellationToken cancellationToken);
    Task<PagedResult<PirepResponse>> GetMineAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken);
    Task<Result<LogbookResponse>> GetLogbookAsync(Guid userId, LogbookSearch search, CancellationToken cancellationToken);
}

public interface IPirepReview
{
    Task<PagedResult<PirepResponse>> SearchAsync(PirepSearch search, CancellationToken cancellationToken);
    Task<Result<PirepResponse>> ApproveAsync(int id, ReviewPirepRequest request, CancellationToken cancellationToken);
    Task<Result<PirepResponse>> RejectAsync(int id, ReviewPirepRequest request, CancellationToken cancellationToken);
}