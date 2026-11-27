namespace SkyBridge.Domain.Staff;

public sealed class StaffMember
{
    public const int MinPositionLength = 2;
    public const int MaxPositionLength = 80;
    public const int MaxSortOrder = 999;

    private StaffMember() { }

    public Guid UserId { get; private set; }
    public string Position { get; private set; } = string.Empty;
    public StaffDepartment Department { get; private set; }
    public int SortOrder { get; private set; }
    public bool PanelAccess { get; private set; }
    public DateTime JoinedAtUtc { get; private set; }

    public static StaffMember Create(Guid userId, string position, StaffDepartment department, int sortOrder, bool panelAccess, DateTime joinedAtUtc)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("A staff member needs a user.", nameof(userId));

        var member = new StaffMember { UserId = userId, JoinedAtUtc = joinedAtUtc };
        member.Update(position, department, sortOrder, panelAccess);
        return member;
    }

    public void Update(string position, StaffDepartment department, int sortOrder, bool panelAccess)
    {
        ArgumentNullException.ThrowIfNull(position);
        var value = position.Trim();
        if (value.Length is < MinPositionLength or > MaxPositionLength)
            throw new ArgumentException($"The position has {MinPositionLength} to {MaxPositionLength} characters.", nameof(position));
        if (!Enum.IsDefined(department))
            throw new ArgumentOutOfRangeException(nameof(department), "Unknown department.");
        ArgumentOutOfRangeException.ThrowIfNegative(sortOrder);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(sortOrder, MaxSortOrder);

        Position = value;
        Department = department;
        SortOrder = sortOrder;
        PanelAccess = panelAccess;
    }
}