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
            <costindex>30</costindex><stepclimb_string>SBFL/0360</stepclimb_string><avg_wind_comp>-12</avg_wind_comp>
            <avg_wind_dir>290</avg_wind_dir><avg_wind_spd>25</avg_wind_spd><avg_temp_dev>3</avg_temp_dev>
            <cruise_tas>452</cruise_tas><cruise_mach>0.78</cruise_mach><cruise_profile>CI 30</cruise_profile>
            <icao_airline>GLO</icao_airline>
            <flight_number>1042</flight_number>
            <initial_altitude>36000</initial_altitude>
            <route_distance>291</route_distance>
            <air_distance>285</air_distance>
            <route>PAKOT UZ6 BUXUK</route>
          </general>
          <origin>
            <icao_code>SBFL</icao_code><name>Hercilio Luz</name><plan_rwy>14</plan_rwy><elevation>16</elevation>
            <trans_alt>7000</trans_alt><trans_level>8000</trans_level><metar>SBFL 241900Z 36010KT CAVOK 27/20 Q1012</metar>
          </origin>
          <destination>
            <icao_code>SBGR</icao_code><name>Guarulhos</name><plan_rwy>10L</plan_rwy><elevation>2461</elevation>
            <trans_alt>6000</trans_alt><trans_level>7000</trans_level><taf>TAF SBGR 241700Z 2418/2524 10008KT 9999 FEW030</taf>
          </destination>
          <alternate>
            <icao_code>{alternate}</icao_code><name>Viracopos</name><plan_rwy>15</plan_rwy><distance>48</distance>
            <cruise_altitude>15000</cruise_altitude><burn>1200</burn><ete>1080</ete><route>DCT</route>
          </alternate>
          <aircraft><icaocode>B738</icaocode><icao_code>B738</icao_code><reg>PR-GXA</reg></aircraft>
          <fuel>
            <plan_ramp>8000</plan_ramp>
            <plan_takeoff>7800</plan_takeoff>
            <plan_landing>4600</plan_landing>
            <enroute_burn>3200</enroute_burn>
            <taxi>200</taxi><contingency>160</contingency><alternate_burn>1200</alternate_burn>
            <reserve>1100</reserve><extra>140</extra><min_takeoff>5800</min_takeoff><avg_fuel_flow>2600</avg_fuel_flow>
          </fuel>
          <navlog>
            <fix><ident>PUN04A</ident><type>wpt</type><via_airway>PUN04A</via_airway><is_sid_star>1</is_sid_star><stage>CLB</stage>
              <altitude_feet>9000</altitude_feet><distance>12</distance><track_mag>142</track_mag><wind_dir>350</wind_dir><wind_spd>12</wind_spd>
              <oat>4</oat><groundspeed>300</groundspeed><time_total>240</time_total><fuel_totalused>600</fuel_totalused><fuel_plan_onboard>7200</fuel_plan_onboard>
              <pos_lat>-27.80</pos_lat><pos_long>-48.45</pos_long></fix>
            <fix><ident>TOC</ident><name>TOP OF CLIMB</name><type>ltlg</type><via_airway>UZ6</via_airway><is_sid_star>0</is_sid_star><stage>CLB</stage>
              <altitude_feet>36000</altitude_feet><distance>90</distance><time_total>1260</time_total><fuel_totalused>1500</fuel_totalused><fuel_plan_onboard>6300</fuel_plan_onboard></fix>
            <fix><ident>BUXUK</ident><type>wpt</type><via_airway>BUXUK1A</via_airway><is_sid_star>1</is_sid_star><stage>DSC</stage>
              <altitude_feet>11000</altitude_feet><distance>150</distance><time_total>3300</time_total><fuel_totalused>3000</fuel_totalused><fuel_plan_onboard>4800</fuel_plan_onboard></fix>
          </navlog>
          <times><est_time_enroute>3720</est_time_enroute></times>
          <weights>
            <pax_count>150</pax_count>
            <cargo>2000</cargo>
            <est_zfw>60000</est_zfw>
            <est_tow>67800</est_tow>
            <est_ldw>64600</est_ldw>
          </weights>
          <atc><callsign>GLO1042</callsign><flightplan_text>(FPL-GLO1042-IS -B738/M-SDE3FGHIRWY/LB1 -SBFL2000 -N0450F360 PAKOT UZ6 BUXUK -SBGR0102 SBKP)</flightplan_text></atc>
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
    public void Parse_ReadsTheFullPlan()
    {
        var details = SimBriefOfpParser.Parse(Ofp()).Plan!.Details!;

        Assert.Equal(("SBFL", "Hercilio Luz", "14", 16, 7000, 8000), (details.Departure.Code, details.Departure.Name!, details.Departure.Runway!,
            details.Departure.ElevationFt, details.Departure.TransitionAltitudeFt, details.Departure.TransitionLevelFt));
        Assert.Contains("CAVOK", details.Departure.Metar);
        Assert.Contains("TAF SBGR", details.Arrival.Taf);
        Assert.Equal(("SBKP", "15", 48, 1200, 18), (details.Alternate!.Code, details.Alternate.Runway!, details.Alternate.DistanceNm,
            details.Alternate.BurnKg, details.Alternate.EnrouteMinutes));
        Assert.Equal((200, 3200, 160, 1200, 1100, 140, 5800, 8000, 2600), (details.Fuel.TaxiKg, details.Fuel.TripKg, details.Fuel.ContingencyKg,
            details.Fuel.AlternateKg, details.Fuel.ReserveKg, details.Fuel.ExtraKg, details.Fuel.MinTakeoffKg, details.Fuel.BlockKg, details.Fuel.AverageFlowKgPerHour));
        Assert.Equal(("30", "PUN04A", "BUXUK1A", -12, 452, "0.78"), (details.Performance.CostIndex!, details.Performance.Sid!, details.Performance.Star!,
            details.Performance.AverageWindComponentKts, details.Performance.CruiseTasKts, details.Performance.CruiseMach!));
        Assert.StartsWith("(FPL-GLO1042", details.AtcFlightPlan);

        Assert.Equal(3, details.Navlog.Count);
        var first = details.Navlog[0];
        Assert.Equal(("PUN04A", true, 9000, 350, 12, 4, 4, 7200), (first.Ident, first.SidStar, first.AltitudeFt, first.WindDirection, first.WindSpeedKts,
            first.OatC, first.ElapsedMinutes, first.FuelOnboardKg));
        Assert.Equal((-27.80, -48.45), (first.Latitude, first.Longitude));
        Assert.Equal(("TOC", "ltlg", 21), (details.Navlog[1].Ident, details.Navlog[1].Type, details.Navlog[1].ElapsedMinutes));
    }

    [Fact]
    public void Parse_KeepsTheDetailsInKilograms_WhenTheOfpIsInPounds()
    {
        var details = SimBriefOfpParser.Parse(Ofp("lbs")).Plan!.Details!;

        Assert.Equal((91, 544, 3266), (details.Fuel.TaxiKg, details.Alternate!.BurnKg, details.Navlog[0].FuelOnboardKg));
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
        var plan = SimBriefOfpParser.Parse(Ofp(alternate: null)).Plan!;

        Assert.Null(plan.Alternate);
        Assert.Null(plan.Details!.Alternate);
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