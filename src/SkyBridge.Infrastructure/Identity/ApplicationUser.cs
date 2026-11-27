using Microsoft.AspNetCore.Identity;

namespace SkyBridge.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastActiveAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? DeactivatedAtUtc { get; set; }
    public DateTime? ReactivationReadyAtUtc { get; set; }
    public int? AcceptedRegulationsVersion { get; set; }
    public DateTime? RegulationsAcceptedAtUtc { get; set; }
}