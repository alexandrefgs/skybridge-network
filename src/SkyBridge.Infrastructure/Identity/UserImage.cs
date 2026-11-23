namespace SkyBridge.Infrastructure.Identity;

public enum UserImageKind : byte
{
    Avatar = 1,
    Cover = 2
}

public class UserImage
{
    public Guid UserId { get; set; }
    public UserImageKind Kind { get; set; }
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = string.Empty;
    public DateTime UpdatedAtUtc { get; set; }
}