namespace SkyBridge.Domain.Aircraft;

public sealed record FamilyMember(int AircraftTypeId, string? Family);

public static class AircraftFamilies
{
    public static IReadOnlySet<int> Bookable(IEnumerable<FamilyMember> scheduled, IEnumerable<FamilyMember> fleet)
    {
        var route = scheduled.ToList();
        var families = route
            .Where(m => !string.IsNullOrWhiteSpace(m.Family))
            .Select(m => m.Family!.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var bookable = route.Select(m => m.AircraftTypeId).ToHashSet();
        foreach (var member in fleet)
        {
            if (!string.IsNullOrWhiteSpace(member.Family) && families.Contains(member.Family.Trim()))
                bookable.Add(member.AircraftTypeId);
        }

        return bookable;
    }
}