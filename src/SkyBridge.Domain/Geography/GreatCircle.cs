namespace SkyBridge.Domain.Geography;

public static class GreatCircle
{
    private const double EarthRadiusNm = 3440.065;

    public static int DistanceNm(double fromLatitude, double fromLongitude, double toLatitude, double toLongitude)
    {
        var lat1 = ToRadians(fromLatitude);
        var lat2 = ToRadians(toLatitude);
        var deltaLat = ToRadians(toLatitude - fromLatitude);
        var deltaLon = ToRadians(toLongitude - fromLongitude);

        var a = Math.Pow(Math.Sin(deltaLat / 2), 2) +
                Math.Cos(lat1) * Math.Cos(lat2) * Math.Pow(Math.Sin(deltaLon / 2), 2);

        return (int)Math.Round(2 * EarthRadiusNm * Math.Asin(Math.Min(1, Math.Sqrt(a))));
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}