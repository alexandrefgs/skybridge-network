using System.ComponentModel.DataAnnotations;

namespace SkyBridge.Application.Profile;

public sealed record UpdateProfileRequest(
    [Required, MaxLength(50)] string FirstName,
    [Required, MaxLength(50)] string LastName);

public sealed record ImageFile(byte[] Content, string ContentType, DateTime UpdatedAtUtc);