using System.Net;
using System.Net.Http.Json;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.FlightPlans;
using SkyBridge.Application.Freelance;
using SkyBridge.Application.Pilots;
using SkyBridge.Application.Pireps;
using SkyBridge.Domain.FlightPlans;
using SkyBridge.Domain.Freelance;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class SimBriefTests(SkyBridgeApiFactory factory)
{
    private const string ImportUrl = "/api/bookings/current/flight-plan";
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task LinkSimBrief_SavesAndClearsThePilotId()
    {
        var pilot = await _client.RegisterPilotAsync();

        var linked = await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/pilot/simbrief", pilot, new SimBriefLinkRequest(" 123456 "));
        var invalid = await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/pilot/simbrief", pilot, new SimBriefLinkRequest("abc"));
        var cleared = await _client.SendAuthorizedAsync(HttpMethod.Put, "/api/pilot/simbrief", pilot, new SimBriefLinkRequest(""));

        Assert.Equal("123456", (await linked.Content.ReadFromJsonAsync<PilotResponse>())!.SimBriefPilotId);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        Assert.Null((await cleared.Content.ReadFromJsonAsync<PilotResponse>())!.SimBriefPilotId);
    }

    [Fact]
    public async Task Import_NeedsAPilotId_AndExplainsSimBriefErrors()
    {
        var pilot = await BookAsync(roundTrip: false);

        var withoutId = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, pilot);
        await _client.LinkSimBriefAsync(pilot);
        var unknown = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, pilot);

        Assert.Contains("Add your SimBrief Pilot ID", await TextAsync(withoutId));
        Assert.Contains("Unknown UserID", await TextAsync(unknown));
    }

    [Fact]
    public async Task Import_RejectsAnOfpForAnotherRouteOrAircraft()
    {
        var pilot = await BookAsync(roundTrip: false);
        var pilotId = await _client.LinkSimBriefAsync(pilot);
        FakeSimBriefClient.Latest[pilotId] = new SimBriefResult(FakeSimBriefClient.Plan("SBGR", "SBRJ", "B738"), null);

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, pilot);

        var text = await TextAsync(response);
        Assert.Contains("departs from SBGR, but this leg departs from SBFL", text);
        Assert.Contains("arrives at SBRJ, but this leg arrives at SBGR", text);
        Assert.Contains("for a B738, but you booked a C172", text);
    }

    [Fact]
    public async Task Import_RejectsAnOfpGeneratedBeforeTheBooking()
    {
        var pilot = await BookAsync(roundTrip: false);
        var pilotId = await _client.LinkSimBriefAsync(pilot);
        FakeSimBriefClient.Latest[pilotId] = new SimBriefResult(FakeSimBriefClient.Plan("SBFL", "SBGR", "C172", DateTime.UtcNow.AddHours(-3)), null);

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, pilot);

        Assert.Contains("generated before you booked", await TextAsync(response));
    }

    [Fact]
    public async Task Import_AttachesTheOfpToTheLeg_AndCanBeReplacedUntilTheLegStarts()
    {
        var pilot = await BookAsync(roundTrip: false);
        var pilotId = await _client.LinkSimBriefAsync(pilot);
        FakeSimBriefClient.Latest[pilotId] = new SimBriefResult(FakeSimBriefClient.Plan("SBFL", "SBGR", "C172") with { BlockFuelKg = 130 }, null);

        var first = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, pilot);
        FakeSimBriefClient.Latest[pilotId] = new SimBriefResult(FakeSimBriefClient.Plan("SBFL", "SBGR", "C172") with { BlockFuelKg = 150 }, null);
        var second = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, pilot);

        first.EnsureSuccessStatusCode();
        var plan = (await second.Content.ReadFromJsonAsync<BookingResponse>())!.FlightPlan!;
        Assert.Equal((1, "SBFL", "SBGR", "C172", 150), (plan.Leg, plan.Origin, plan.Destination, plan.Aircraft, plan.BlockFuelKg));

        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/start", pilot)).EnsureSuccessStatusCode();
        var during = await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, pilot);

        Assert.Contains("already in progress", await TextAsync(during));
    }

    [Fact]
    public async Task Import_KeepsTheFullFlightPlan()
    {
        var pilot = await BookAsync(roundTrip: false);
        var pilotId = await _client.LinkSimBriefAsync(pilot);
        var details = new FlightPlanDetails(
            new FlightPlanAirport("SBFL", "Hercilio Luz", "14", 16, 7000, 8000, "SBFL CAVOK", null),
            new FlightPlanAirport("SBGR", "Guarulhos", "10L", 2461, 6000, 7000, null, null),
            null,
            new FlightPlanFuel(10, 70, 5, 0, 30, 5, 100, 110, 120, 40, 35),
            new FlightPlanPerformance(null, null, null, null, 290, 15, -8, 2, 120, null, null, null, null),
            "(FPL-N172SB-VG)",
            [new NavlogFix("TOC", "TOP OF CLIMB", "ltlg", "DCT", "CLB", false, 9000, 30, 30, 290, 15, 2, 110, 16, 20, 100, -27.4, -48.4)]);
        FakeSimBriefClient.Latest[pilotId] = new SimBriefResult(FakeSimBriefClient.Plan("SBFL", "SBGR", "C172") with { Details = details }, null);

        await _client.SendAuthorizedAsync(HttpMethod.Post, ImportUrl, pilot);
        var current = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/bookings/current", pilot);

        var plan = (await current.Content.ReadFromJsonAsync<BookingResponse>())!.FlightPlan!;
        Assert.Equal("14", plan.Details!.Departure.Runway);
        Assert.Equal("(FPL-N172SB-VG)", plan.Details.AtcFlightPlan);
        Assert.Equal(("TOC", 9000, 16), (plan.Details.Navlog[0].Ident, plan.Details.Navlog[0].AltitudeFt, plan.Details.Navlog[0].ElapsedMinutes));
    }

    [Fact]
    public async Task EachLeg_NeedsItsOwnOfp()
    {
        var pilot = await BookAsync(roundTrip: true);
        await _client.ImportMatchingPlanAsync(pilot);
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/start", pilot)).EnsureSuccessStatusCode();

        var arrived = DateTime.UtcNow.AddMinutes(-1);
        var filed = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pireps", pilot,
            new FilePirepRequest(arrived.AddMinutes(-2), arrived, null, null, null));
        var booking = (await filed.Content.ReadFromJsonAsync<PirepFiledResponse>())!.Booking!;
        var startLeg2 = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/start", pilot);

        Assert.Equal(2, booking.CurrentLeg);
        Assert.Null(booking.FlightPlan);
        Assert.Contains("Import the SimBrief OFP for leg 2", await TextAsync(startLeg2));
    }

    private async Task<string> BookAsync(bool roundTrip)
    {
        var admin = await _client.LoginAsAdminAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", admin)).EnsureSuccessStatusCode();
        var request = new FreelanceJobRequest(FreelanceJobKind.AirTaxi, 500, DateTime.UtcNow.AddDays(2), ["C172"],
            roundTrip
                ? [new FreelanceLegRequest("SBFL", "SBGR", 2, 20), new FreelanceLegRequest("SBGR", "SBFL", 1, 10)]
                : [new FreelanceLegRequest("SBFL", "SBGR", 2, 20)],
            "Test client");
        var created = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/freelance", admin, request);
        created.EnsureSuccessStatusCode();
        var job = (await created.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;

        var pilot = await _client.RegisterPilotAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pilot/jumpseat", pilot, new JumpseatRequest("SBFL"))).EnsureSuccessStatusCode();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, $"/api/freelance/{job.Id}/accept", pilot, new AcceptJobRequest("C172"))).EnsureSuccessStatusCode();
        return pilot;
    }

    private static async Task<string> TextAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        return await response.Content.ReadAsStringAsync();
    }
}