using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Common;
using SkyBridge.Application.Freelance;
using SkyBridge.Application.Pilots;
using SkyBridge.Application.Pireps;
using SkyBridge.Domain.Freelance;
using SkyBridge.Infrastructure.Persistence;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class PirepTests(SkyBridgeApiFactory factory)
{
    private const string AdminUrl = "/api/admin/pireps";
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task File_CompletesEachLeg_MovesThePilot_AndPaysAfterTheLast()
    {
        var job = await CreateJobAsync(reward: 800, roundTrip: true);
        var pilot = await PilotAtAsync("SBFL");
        await AcceptAndStartAsync(pilot, job.Id);

        var first = await FileAsync(pilot, minutes: 140);

        Assert.Equal("Accepted", first.Pirep.Status);
        Assert.Equal(("SBFL", "SBGR", 1, 2), (first.Pirep.Origin, first.Pirep.Destination, first.Pirep.Leg, first.Pirep.LegCount));
        Assert.Equal((2, false), (first.Booking!.CurrentLeg, first.Booking.LegInProgress));
        Assert.Null(first.RewardPaid);
        Assert.Equal(("SBGR", 2.3m, 0), (first.Pilot.Location!.Code, first.Pilot.FlightHours, first.Pilot.Balance));

        await StartAsync(pilot);
        var last = await FileAsync(pilot, minutes: 140);

        Assert.Null(last.Booking);
        Assert.Equal(800, last.RewardPaid);
        Assert.Equal(("SBFL", 4.7m, 800), (last.Pilot.Location!.Code, last.Pilot.FlightHours, last.Pilot.Balance));

        var transactions = await GetAsync<PagedResult<PilotTransactionResponse>>("/api/pilot/transactions", pilot);
        Assert.Equal(800, Assert.Single(transactions.Items).Amount);

        var logbook = await GetAsync<PagedResult<PirepResponse>>("/api/pireps/mine", pilot);
        Assert.Equal(2, logbook.TotalCount);

        var board = await GetAsync<PagedResult<FreelanceJobResponse>>("/api/freelance?pageSize=100", pilot);
        Assert.DoesNotContain(board.Items, j => j.Id == job.Id);
    }
    
    [Fact]
    public async Task Logbook_SummarizesThePeriod_AndDrawsTheRoutes()
    {
        var job = await CreateJobAsync(reward: 800, roundTrip: true);
        var pilot = await PilotAtAsync("SBFL");
        await AcceptAndStartAsync(pilot, job.Id);
        await FileAsync(pilot, minutes: 140);
        await StartAsync(pilot);
        await FileAsync(pilot, minutes: 150);

        var month = await GetAsync<LogbookResponse>("/api/pireps/logbook", pilot);
        var all = await GetAsync<LogbookResponse>("/api/pireps/logbook?period=all&pageSize=1", pilot);
        var invalid = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/pireps/logbook?period=week", pilot);

        Assert.Equal("30d", month.Period);
        Assert.Equal((2, 290, 800, 2, "C172"), (month.Summary.Flights, month.Summary.FlightMinutes, month.Summary.Earned,
            month.Summary.Airports, month.Summary.FavoriteAircraft));
        Assert.Equal(new[] { "SBFL", "SBGR" }, month.Network.Airports.Select(a => a.Code));
        Assert.Equal(new[] { 0, 1 }, Assert.Single(month.Network.Links));
        Assert.Equal(("SBGR", "SBFL"), (month.Flights.Items[0].Origin, month.Flights.Items[0].Destination));
        Assert.Equal(("all", 2, 1), (all.Period, all.Flights.TotalCount, all.Flights.Items.Count));
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
    }

    [Fact]
    public async Task File_TooFast_WaitsForStaff_ThenApprovalPaysTheReward()
    {
        var job = await CreateJobAsync(reward: 500);
        var pilot = await PilotAtAsync("SBFL");
        await AcceptAndStartAsync(pilot, job.Id);

        var filed = await FileAsync(pilot, minutes: 30);

        Assert.Equal("Pending", filed.Pirep.Status);
        Assert.Contains("too short", filed.Pirep.Flag);
        Assert.Null(filed.Booking);
        Assert.Null(filed.RewardPaid);
        Assert.Equal(("SBGR", 0m, 0), (filed.Pilot.Location!.Code, filed.Pilot.FlightHours, filed.Pilot.Balance));

        var admin = await _client.LoginAsAdminAsync();
        var pending = await GetAsync<PagedResult<PirepResponse>>($"{AdminUrl}?status=pending&pageSize=100", admin);
        Assert.Contains(pending.Items, p => p.Id == filed.Pirep.Id);

        var approved = await _client.SendAuthorizedAsync(HttpMethod.Post, $"{AdminUrl}/{filed.Pirep.Id}/approve", admin, new ReviewPirepRequest("Strong tailwind"));
        var twice = await _client.SendAuthorizedAsync(HttpMethod.Post, $"{AdminUrl}/{filed.Pirep.Id}/approve", admin, new ReviewPirepRequest(null));

        approved.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Conflict, twice.StatusCode);
        var me = await GetAsync<PilotResponse>("/api/pilot", pilot);
        Assert.Equal((0.5m, 500), (me.FlightHours, me.Balance));
    }

    [Fact]
    public async Task Reject_NeedsANote_AndNoRewardIsPaid()
    {
        var job = await CreateJobAsync(reward: 500);
        var pilot = await PilotAtAsync("SBFL");
        await AcceptAndStartAsync(pilot, job.Id);
        var filed = await FileAsync(pilot, minutes: 30);
        var admin = await _client.LoginAsAdminAsync();

        var withoutNote = await _client.SendAuthorizedAsync(HttpMethod.Post, $"{AdminUrl}/{filed.Pirep.Id}/reject", admin, new ReviewPirepRequest(null));
        var rejected = await _client.SendAuthorizedAsync(HttpMethod.Post, $"{AdminUrl}/{filed.Pirep.Id}/reject", admin, new ReviewPirepRequest("Slew mode used."));

        Assert.Equal(HttpStatusCode.BadRequest, withoutNote.StatusCode);
        var pirep = (await rejected.Content.ReadFromJsonAsync<PirepResponse>())!;
        Assert.Equal(("Rejected", "Slew mode used."), (pirep.Status, pirep.ReviewNote));
        var me = await GetAsync<PilotResponse>("/api/pilot", pilot);
        Assert.Equal((0m, 0), (me.FlightHours, me.Balance));
    }

    [Fact]
    public async Task File_Returns400_BeforeTheLegStarts_OrWithImpossibleTimes()
    {
        var job = await CreateJobAsync(reward: 100);
        var pilot = await PilotAtAsync("SBFL");
        (await AcceptAsync(pilot, job.Id)).EnsureSuccessStatusCode();
        var now = DateTime.UtcNow;

        var notStarted = await PostPirepAsync(pilot, new FilePirepRequest(now.AddHours(-2), now.AddHours(-1), null, null, null));
        await StartAsync(pilot);
        var backwards = await PostPirepAsync(pilot, new FilePirepRequest(now.AddMinutes(-10), now.AddMinutes(-20), null, null, null));

        Assert.Equal(HttpStatusCode.BadRequest, notStarted.StatusCode);
        Assert.Contains("Start the leg", await notStarted.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.BadRequest, backwards.StatusCode);
        Assert.Contains("Landing must be after takeoff.", await backwards.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task File_Returns404_WithoutAnActiveFlight()
    {
        var pilot = await PilotAtAsync("SBFL");
        var now = DateTime.UtcNow;

        var response = await PostPirepAsync(pilot, new FilePirepRequest(now.AddHours(-2), now.AddHours(-1), null, null, null));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateJob_Returns409_OnceAPilotTookIt()
    {
        var job = await CreateJobAsync(reward: 100);
        var pilot = await PilotAtAsync("SBFL");
        (await AcceptAsync(pilot, job.Id)).EnsureSuccessStatusCode();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Put, $"/api/admin/freelance/{job.Id}", await _client.LoginAsAdminAsync(), JobRequest(999, false));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    private static FreelanceJobRequest JobRequest(int reward, bool roundTrip) =>
        new(FreelanceJobKind.AirTaxi, reward, DateTime.UtcNow.AddDays(2), ["C172"],
            roundTrip
                ? [new FreelanceLegRequest("SBFL", "SBGR", 2, 20), new FreelanceLegRequest("SBGR", "SBFL", 1, 10)]
                : [new FreelanceLegRequest("SBFL", "SBGR", 2, 20)],
            "Test client");

    private async Task<FreelanceJobResponse> CreateJobAsync(int reward, bool roundTrip = false)
    {
        var admin = await _client.LoginAsAdminAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", admin)).EnsureSuccessStatusCode();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/freelance", admin, JobRequest(reward, roundTrip));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;
    }

    private async Task<string> PilotAtAsync(string airport)
    {
        var token = await _client.RegisterPilotAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pilot/jumpseat", token, new JumpseatRequest(airport))).EnsureSuccessStatusCode();
        return token;
    }

    private Task<HttpResponseMessage> AcceptAsync(string token, int jobId) =>
        _client.SendAuthorizedAsync(HttpMethod.Post, $"/api/freelance/{jobId}/accept", token, new AcceptJobRequest("C172"));

    private async Task AcceptAndStartAsync(string token, int jobId)
    {
        (await AcceptAsync(token, jobId)).EnsureSuccessStatusCode();
        await StartAsync(token);
    }

    private async Task StartAsync(string token)
    {
        await _client.ImportMatchingPlanAsync(token);
        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/start", token);
        response.EnsureSuccessStatusCode();
        var booking = (await response.Content.ReadFromJsonAsync<BookingResponse>())!;

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SkyBridgeDbContext>();
        DateTime? started = DateTime.UtcNow.AddHours(-4);
        await db.Bookings.Where(b => b.Id == booking.Id)
            .ExecuteUpdateAsync(b => b.SetProperty(x => x.LegStartedAtUtc, started));
    }

    private Task<HttpResponseMessage> PostPirepAsync(string token, FilePirepRequest request) =>
        _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pireps", token, request);

    private async Task<PirepFiledResponse> FileAsync(string token, int minutes)
    {
        var arrived = DateTime.UtcNow.AddMinutes(-30);
        var response = await PostPirepAsync(token, new FilePirepRequest(arrived.AddMinutes(-minutes), arrived, 45, 160, "Test flight"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PirepFiledResponse>())!;
    }

    private async Task<T> GetAsync<T>(string url, string token)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, url, token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }
}