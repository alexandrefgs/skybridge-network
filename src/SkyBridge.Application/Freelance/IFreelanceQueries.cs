using SkyBridge.Application.Common;

namespace SkyBridge.Application.Freelance;

public interface IFreelanceQueries
{
    Task<PagedResult<FreelanceJobResponse>> SearchAsync(FreelanceJobSearch search, CancellationToken cancellationToken);
    Task<FreelanceJobResponse?> GetAsync(int id, CancellationToken cancellationToken);
}