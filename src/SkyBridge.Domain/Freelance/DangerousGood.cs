using System.Text.RegularExpressions;

namespace SkyBridge.Domain.Freelance;

public enum DangerousGoodClass
{
    Explosives = 1,
    Gases = 2,
    FlammableLiquids = 3,
    FlammableSolids = 4,
    Oxidizers = 5,
    Toxic = 6,
    Radioactive = 7,
    Corrosives = 8,
    Miscellaneous = 9
}

public sealed partial record DangerousGood(string Name, DangerousGoodClass Class, int QuantityKg, string? UnNumber)
{
    public const int MaxNameLength = 80;

    public static DangerousGood Create(string name, DangerousGoodClass hazardClass, int quantityKg, string? unNumber)
    {
        var cleanName = name?.Trim() ?? string.Empty;
        if (cleanName.Length is 0 or > MaxNameLength)
            throw new ArgumentException($"Dangerous good needs a name with up to {MaxNameLength} characters.", nameof(name));
        if (!Enum.IsDefined(hazardClass))
            throw new ArgumentOutOfRangeException(nameof(hazardClass), "Unknown hazard class.");
        ArgumentOutOfRangeException.ThrowIfNegative(quantityKg);

        var un = string.IsNullOrWhiteSpace(unNumber) ? null : unNumber.Replace(" ", "").ToUpperInvariant();
        if (un is not null)
        {
            if (!un.StartsWith("UN", StringComparison.Ordinal))
                un = "UN" + un;
            if (!UnPattern().IsMatch(un))
                throw new ArgumentException("UN number must have 4 digits, like UN1203.", nameof(unNumber));
        }

        return new DangerousGood(cleanName, hazardClass, quantityKg, un);
    }

    [GeneratedRegex("^UN[0-9]{4}$")]
    private static partial Regex UnPattern();
}