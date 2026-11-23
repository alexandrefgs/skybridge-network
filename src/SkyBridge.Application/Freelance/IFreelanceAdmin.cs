using SkyBridge.Application.Common;

namespace SkyBridge.Application.Freelance;

public interface IFreelanceAdmin
{
    Task<Result<FreelanceJobResponse>> CreateAsync(FreelanceJobRequest request, CancellationToken cancellationToken);
    Task<Result<FreelanceJobResponse>> UpdateAsync(int id, FreelanceJobRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}