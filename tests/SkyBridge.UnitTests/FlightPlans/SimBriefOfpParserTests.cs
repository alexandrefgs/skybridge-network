using SkyBridge.Application.FlightPlans;

namespace SkyBridge.UnitTests.FlightPlans;

public class SimBriefOfpParserTests
{
    private static string Ofp(string units = "kgs", string? alternate = "SBKP") => $"""
        <?xml version="1.0" encoding="UTF-8"?>
        <OFP>
          <fetch><userid>123456</userid><status>Success</status></fetch>
          <params>
            <request_id>98765432</request_id>
            <time_generated>1795464000</time_generated>
            <airac>2611</airac>
            <units>{units}</units>
          </params>
          <general>
            <icao_airline>GLO</icao_airline>
            <flight_number>1042</flight_number>
            <initial_altitude>36000</initial_altitude>
            <route_distance>291</route_distance>
            <air_distance>285</air_distance>
            <route>PAKOT UZ6 BUXUK</route>
          </general>
          <origin><icao_code>SBFL</icao_code></origin>
          <destination><icao_code>SBGR</icao_code></destination>
          <alternate><icao_code>{alternate}</icao_code></alternate>
          <aircraft><icaocode>B738</icaocode><icao_code>B738</icao_code><reg>PR-GXA</reg></aircraft>
          <fuel>
            <plan_ramp>8000</plan_ramp>
            <plan_takeoff>7800</plan_takeoff>
            <plan_landing>4600</plan_landing>
            <enroute_burn>3200</enroute_burn>
          </fuel>
          <times><est_time_enroute>3720</est_time_enroute></times>
          <weights>
            <pax_count>150</pax_count>
            <cargo>2000</cargo>
            <est_zfw>60000</est_zfw>
            <est_tow>67800</est_tow>
            <est_ldw>64600</est_ldw>
          </weights>
          <atc><callsign>GLO1042</callsign></atc>
        </OFP>
        """;

    [Fact]
    public void Parse_ReadsTheLatestOfp()
    {
        var plan = SimBriefOfpParser.Parse(Ofp()).Plan!;

        Assert.Equal(("98765432", "2611", "SBFL", "SBGR", "SBKP"), (plan.SimBriefId, plan.Airac!, plan.Origin, plan.Destination, plan.Alternate!));
        Assert.Equal(("B738", "PR-GXA", "GLO1042", "PAKOT UZ6 BUXUK"), (plan.Aircraft, plan.Registration!, plan.Callsign!, plan.Route));
        Assert.Equal((36000, 285, 62), (plan.CruiseAltitudeFt, plan.DistanceNm, plan.EnrouteMinutes));
        Assert.Equal((8000, 7800, 4600, 3200), (plan.BlockFuelKg, plan.TakeoffFuelKg, plan.LandingFuelKg, plan.TripFuelKg));
        Assert.Equal((150, 2000, 60000, 67800, 64600), (plan.PassengerCount, plan.CargoKg, plan.ZeroFuelWeightKg, plan.TakeoffWeightKg, plan.LandingWeightKg));
        Assert.Equal(new DateTime(2026, 11, 23, 20, 0, 0, DateTimeKind.Utc), plan.GeneratedAtUtc);
    }

    [Fact]
    public void Parse_ConvertsPoundsToKilograms()
    {
        var plan = SimBriefOfpParser.Parse(Ofp("lbs")).Plan!;

        Assert.Equal((3629, 2087, 27216), (plan.BlockFuelKg, plan.LandingFuelKg, plan.ZeroFuelWeightKg));
    }

    [Fact]
    public void Parse_AllowsAPlanWithoutAlternate()
    {
        Assert.Null(SimBriefOfpParser.Parse(Ofp(alternate: null)).Plan!.Alternate);
    }

    [Theory]
    [InlineData("<OFP><fetch><status>Error: Unknown UserID</status></fetch></OFP>", "Unknown UserID")]
    [InlineData("<error>No flight plan found</error>", "No flight plan found")]
    [InlineData("not xml", "could not read")]
    [InlineData("<OFP><params><request_id>1</request_id></params></OFP>", "incomplete")]
    public void Parse_ExplainsErrors(string xml, string message)
    {
        var result = SimBriefOfpParser.Parse(xml);

        Assert.Null(result.Plan);
        Assert.Contains(message, result.Error);
    }
}