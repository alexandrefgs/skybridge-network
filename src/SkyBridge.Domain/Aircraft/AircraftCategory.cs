namespace SkyBridge.Domain.Aircraft;

public sealed class AircraftCategory
{
    private AircraftCategory() { }

    public AircraftCategoryCode Code { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public int RequiredHours { get; private set; }
    public int PayPerHour { get; private set; }

    public static AircraftCategory Create(AircraftCategoryCode code, string name, int requiredHours, int payPerHour)
    {
        if (!Enum.IsDefined(code))
            throw new ArgumentOutOfRangeException(nameof(code));

        var category = new AircraftCategory { Code = code };
        category.Update(name, requiredHours, payPerHour);
        return category;
    }

    public void Update(string name, int requiredHours, int payPerHour)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentOutOfRangeException.ThrowIfNegative(requiredHours);
        ArgumentOutOfRangeException.ThrowIfNegative(payPerHour);

        Name = name.Trim();
        RequiredHours = requiredHours;
        PayPerHour = payPerHour;
    }

    public bool IsUnlockedFor(decimal flightHours) => flightHours >= RequiredHours;
}