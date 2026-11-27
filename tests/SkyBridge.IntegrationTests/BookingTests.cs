using System.Net;
using System.Net.Http.Json;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Common;
using SkyBridge.Application.Freelance;
using SkyBridge.Application.Pilots;
using SkyBridge.Domain.Freelance;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class BookingTests(SkyBridgeApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Current_Returns204_WithoutAnActiveFlight()
    {
        var pilot = await _client.RegisterPilotAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/bookings/current", pilot);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Accept_TakesTheJob_AndHidesItFromTheBoard()
    {
        var job = await CreateJobAsync("C172");
        var pilot = await PilotAtAsync("SBFL");

        var accepted = await AcceptAsync(pilot, job.Id, "c172");

        accepted.EnsureSuccessStatusCode();
        var booking = (await accepted.Content.ReadFromJsonAsync<BookingResponse>())!;
        Assert.Equal(("Active", "Freelance", "C172", 1, 2), (booking.Status, booking.Source, booking.Aircraft, booking.CurrentLeg, booking.LegCount));
        Assert.Equal("Piston", booking.AircraftEngine);
        Assert.Equal(job.Id, booking.Job!.Id);

        var other = await PilotAtAsync("SBFL");
        var board = await GetAsync<PagedResult<FreelanceJobResponse>>("/api/freelance?from=SBFL&pageSize=100", other);
        Assert.DoesNotContain(board.Items, j => j.Id == job.Id);

        var again = await AcceptAsync(other, job.Id, "C172");
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);

        var admin = await GetAsync<PagedResult<FreelanceJobResponse>>("/api/admin/freelance?pageSize=100", await _client.LoginAsAdminAsync());
        Assert.True(admin.Items.Single(j => j.Id == job.Id).Taken);
    }

    [Fact]
    public async Task Accept_Returns400_WhenThePilotIsElsewhere()
    {
        var job = await CreateJobAsync("C172");
        var pilot = await PilotAtAsync("SBGR");

        var response = await AcceptAsync(pilot, job.Id, "C172");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("departs from SBFL", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Accept_Returns400_ForAircraftNotAllowedOrStillLocked()
    {
        var job = await CreateJobAsync("C172", "C208");
        var pilot = await PilotAtAsync("SBFL");

        var notAllowed = await AcceptAsync(pilot, job.Id, "B738");
        var locked = await AcceptAsync(pilot, job.Id, "C208");

        Assert.Equal(HttpStatusCode.BadRequest, notAllowed.StatusCode);
        Assert.Contains("not allowed", await notAllowed.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.BadRequest, locked.StatusCode);
        Assert.Contains("needs 25 h", await locked.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Accept_Returns409_WhenThePilotAlreadyHasAFlight()
    {
        var first = await CreateJobAsync("C172");
        var second = await CreateJobAsync("C172");
        var pilot = await PilotAtAsync("SBFL");
        (await AcceptAsync(pilot, first.Id, "C172")).EnsureSuccessStatusCode();

        var response = await AcceptAsync(pilot, second.Id, "C172");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task StartLeg_ThenCancel_ReturnsTheJobToTheBoard()
    {
        var job = await CreateJobAsync("C172");
        var pilot = await PilotAtAsync("SBFL");
        (await AcceptAsync(pilot, job.Id, "C172")).EnsureSuccessStatusCode();

        var withoutPlan = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/start", pilot);
        Assert.Equal(HttpStatusCode.BadRequest, withoutPlan.StatusCode);
        Assert.Contains("Import the SimBrief OFP for leg 1", await withoutPlan.Content.ReadAsStringAsync());

        await _client.ImportMatchingPlanAsync(pilot);
        var started = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/start", pilot);
        var twice = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/start", pilot);

        var booking = (await started.Content.ReadFromJsonAsync<BookingResponse>())!;
        Assert.True(booking.LegInProgress);
        Assert.NotNull(booking.StartedAtUtc);
        Assert.Equal(HttpStatusCode.BadRequest, twice.StatusCode);

        var cancelled = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/cancel", pilot);
        var current = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/bookings/current", pilot);
        var board = await GetAsync<PagedResult<FreelanceJobResponse>>("/api/freelance?from=SBFL&pageSize=100", pilot);

        Assert.Equal(HttpStatusCode.NoContent, cancelled.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, current.StatusCode);
        Assert.Contains(board.Items, j => j.Id == job.Id);
    }

    [Fact]
    public async Task Jumpseat_IsBlocked_DuringAnActiveFlight()
    {
        var job = await CreateJobAsync("C172");
        var pilot = await PilotAtAsync("SBFL");
        (await AcceptAsync(pilot, job.Id, "C172")).EnsureSuccessStatusCode();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pilot/jumpseat", pilot, new JumpseatRequest("SBGR"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task DeleteJob_Returns409_WhileAPilotIsFlyingIt()
    {
        var job = await CreateJobAsync("C172");
        var pilot = await PilotAtAsync("SBFL");
        (await AcceptAsync(pilot, job.Id, "C172")).EnsureSuccessStatusCode();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Delete, $"/api/admin/freelance/{job.Id}", await _client.LoginAsAdminAsync());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    private async Task<FreelanceJobResponse> CreateJobAsync(params string[] aircraft)
    {
        var admin = await _client.LoginAsAdminAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", admin)).EnsureSuccessStatusCode();

        var request = new FreelanceJobRequest(FreelanceJobKind.AirTaxi, 800, DateTime.UtcNow.AddDays(2), aircraft,
            [new FreelanceLegRequest("SBFL", "SBGR", 2, 20), new FreelanceLegRequest("SBGR", "SBFL", 1, 10)], "Test client");
        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/freelance", admin, request);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;
    }

    private async Task<string> PilotAtAsync(string airport)
    {
        var token = await _client.RegisterPilotAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pilot/jumpseat", token, new JumpseatRequest(airport))).EnsureSuccessStatusCode();
        return token;
    }

    private Task<HttpResponseMessage> AcceptAsync(string token, int jobId, string aircraft) =>
        _client.SendAuthorizedAsync(HttpMethod.Post, $"/api/freelance/{jobId}/accept", token, new AcceptJobRequest(aircraft));

    private async Task<T> GetAsync<T>(string url, string token)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, url, token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }
}