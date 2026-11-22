namespace SkyBridge.Domain.Users;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Staff = "Staff";
    public const string Pilot = "Pilot";

    public static readonly IReadOnlyList<string> All = [Admin, Staff, Pilot];
}