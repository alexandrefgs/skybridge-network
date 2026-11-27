using SkyBridge.Domain.Staff;

namespace SkyBridge.UnitTests.Staff;

public class StaffMemberTests
{
    private static readonly DateTime Joined = new(2026, 11, 27, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Create_TrimsThePosition_AndKeepsTheJoinDate()
    {
        var member = StaffMember.Create(Guid.NewGuid(), "  Chief Executive Officer ", StaffDepartment.Executive, 1, true, Joined);

        Assert.Equal(("Chief Executive Officer", StaffDepartment.Executive, 1, true, Joined),
            (member.Position, member.Department, member.SortOrder, member.PanelAccess, member.JoinedAtUtc));
    }

    [Fact]
    public void Update_ChangesEverythingButTheJoinDate()
    {
        var member = StaffMember.Create(Guid.NewGuid(), "Events Manager", StaffDepartment.Events, 5, false, Joined);

        member.Update("Head of Safety", StaffDepartment.Safety, 2, true);

        Assert.Equal(("Head of Safety", StaffDepartment.Safety, 2, true, Joined),
            (member.Position, member.Department, member.SortOrder, member.PanelAccess, member.JoinedAtUtc));
    }

    [Fact]
    public void Create_RejectsAnEmptyUser()
    {
        Assert.Throws<ArgumentException>(() => StaffMember.Create(Guid.Empty, "CEO", StaffDepartment.Executive, 0, false, Joined));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" A ")]
    public void Create_RejectsATooShortPosition(string position)
    {
        Assert.Throws<ArgumentException>(() => StaffMember.Create(Guid.NewGuid(), position, StaffDepartment.Executive, 0, false, Joined));
    }

    [Fact]
    public void Create_RejectsATooLongPosition()
    {
        var position = new string('x', StaffMember.MaxPositionLength + 1);

        Assert.Throws<ArgumentException>(() => StaffMember.Create(Guid.NewGuid(), position, StaffDepartment.Executive, 0, false, Joined));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(StaffMember.MaxSortOrder + 1)]
    public void Create_RejectsAnOrderOutOfRange(int order)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => StaffMember.Create(Guid.NewGuid(), "CEO", StaffDepartment.Executive, order, false, Joined));
    }

    [Fact]
    public void Create_RejectsAnUnknownDepartment()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => StaffMember.Create(Guid.NewGuid(), "CEO", (StaffDepartment)99, 0, false, Joined));
    }
}