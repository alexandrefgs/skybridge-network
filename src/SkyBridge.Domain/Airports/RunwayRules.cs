namespace SkyBridge.Domain.Aircraft;

public enum RunwayFit
{
    Ok = 0,
    NoData = 1,
    TooShort = 2,
    NeedsPaved = 3
}

public static class RunwayRules
{
    public static RunwayFit Check(int minRunwayFt, bool requiresPaved, int? longestRunwayFt, int? longestHardRunwayFt)
    {
        if (longestRunwayFt is null)
            return RunwayFit.NoData;

        if (!requiresPaved)
            return longestRunwayFt >= minRunwayFt ? RunwayFit.Ok : RunwayFit.TooShort;

        if (longestHardRunwayFt >= minRunwayFt)
            return RunwayFit.Ok;

        return longestRunwayFt >= minRunwayFt ? RunwayFit.NeedsPaved : RunwayFit.TooShort;
    }
}