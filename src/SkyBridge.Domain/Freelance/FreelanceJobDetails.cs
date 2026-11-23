namespace SkyBridge.Domain.Freelance;

public sealed record FreelanceJobDetails(
    FreelanceJobKind Kind,
    string? Client,
    string? Briefing,
    int Reward,
    DateTime ExpiresAtUtc);