using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.Common;
using SkyBridge.Application.Pilots;
using SkyBridge.Application.Pireps;
using SkyBridge.Infrastructure.Persistence;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class RouteBookingTests(SkyBridgeApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task BookRoute_FlyTheLeg_AndGetPaidByTheHour()
    {
        var (icao, route) = await CreateRouteAsync(["C172"]);
        var pilot = await PilotAtAsync("SBFL");

        var booked = await BookAsync(pilot, route.Id, "c172");

        booked.EnsureSuccessStatusCode();
        var booking = (await booked.Content.ReadFromJsonAsync<BookingResponse>())!;
        var flightNumber = $"{icao}{1000 + route.Id % 9000}";
        Assert.Equal(("Airline", flightNumber, 60, 1), (booking.Source, booking.FlightNumber, booking.PayPerHour, booking.LegCount));
        Assert.Equal(("SBFL", "SBGR", 278, route.Id), (booking.Flight!.Origin, booking.Flight.Destination, booking.Flight.DistanceNm, booking.Flight.RouteId));
        Assert.Null(booking.Job);
        Assert.InRange(booking.StartDeadlineUtc - booking.BookedAtUtc, TimeSpan.FromHours(23.9), TimeSpan.FromHours(24.1));

        await StartAsync(pilot);
        var filed = await FileAsync(pilot, minutes: 140);

        Assert.Equal("Accepted", filed.Pirep.Status);
        Assert.Null(filed.Booking);
        Assert.Equal(140, filed.RewardPaid);
        Assert.Equal(("SBGR", 140, 140), (filed.Pilot.Location!.Code, filed.Pilot.FlightMinutes, filed.Pilot.Balance));

        var transactions = await GetAsync<PagedResult<PilotTransactionResponse>>("/api/pilot/transactions", pilot);
        Assert.Equal($"Flight {flightNumber} · 2h20min at $60/h", Assert.Single(transactions.Items).Description);
    }

    [Fact]
    public async Task BookRoute_SameRoute_CanBeFlownByManyPilots()
    {
        var (_, route) = await CreateRouteAsync(["C172"]);

        var first = await BookAsync(await PilotAtAsync("SBFL"), route.Id, "C172");
        var second = await BookAsync(await PilotAtAsync("SBFL"), route.Id, "C172");

        first.EnsureSuccessStatusCode();
        second.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task BookRoute_Returns400_ForTheWrongAirportAircraftOrAirline()
    {
        var (_, route) = await CreateRouteAsync(["C172", "C208"]);
        var (_, empty) = await CreateRouteAsync([]);
        var (_, closed) = await CreateRouteAsync(["C172"], active: false);
        var atGru = await PilotAtAsync("SBGR");
        var atFln = await PilotAtAsync("SBFL");

        var elsewhere = await BookAsync(atGru, route.Id, "C172");
        var notOnRoute = await BookAsync(atFln, route.Id, "B738");
        var locked = await BookAsync(atFln, route.Id, "C208");
        var noAircraft = await BookAsync(atFln, empty.Id, "C172");
        var inactive = await BookAsync(atFln, closed.Id, "C172");
        var missing = await BookAsync(atFln, 999_999, "C172");

        Assert.Contains("This flight departs from SBFL", await TextAsync(elsewhere, HttpStatusCode.BadRequest));
        Assert.Contains("not allowed on this flight", await TextAsync(notOnRoute, HttpStatusCode.BadRequest));
        Assert.Contains("needs 25 h", await TextAsync(locked, HttpStatusCode.BadRequest));
        Assert.Contains("No aircraft is assigned", await TextAsync(noAircraft, HttpStatusCode.BadRequest));
        Assert.Contains("is not operating", await TextAsync(inactive, HttpStatusCode.BadRequest));
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task BookRoute_AllowsTheSameFamilyFromTheAirlineFleet()
    {
        var (_, route) = await CreateRouteAsync(["B737"], fleet: ["B737", "B738", "A320"]);
        var pilot = await PilotAtAsync("SBFL");

        var sameFamily = await BookAsync(pilot, route.Id, "B738");
        var otherFamily = await BookAsync(pilot, route.Id, "A320");

        Assert.Equal(new[] { "B737" }, route.Aircraft);
        Assert.Equal(new[] { "B737", "B738" }, route.BookableAircraft);
        Assert.Contains("needs 300 h", await TextAsync(sameFamily, HttpStatusCode.BadRequest));
        Assert.Contains("A320 is not allowed on this flight", await TextAsync(otherFamily, HttpStatusCode.BadRequest));
    }

    [Fact]
    public async Task BookRoute_Returns409_WithAnotherActiveFlight()
    {
        var (_, route) = await CreateRouteAsync(["C172"]);
        var pilot = await PilotAtAsync("SBFL");
        (await BookAsync(pilot, route.Id, "C172")).EnsureSuccessStatusCode();

        var again = await BookAsync(pilot, route.Id, "C172");

        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
    }

    [Fact]
    public async Task Booking_Expires_WhenNotStartedWithin24Hours()
    {
        var (_, route) = await CreateRouteAsync(["C172"]);
        var pilot = await PilotAtAsync("SBFL");
        var booked = await BookAsync(pilot, route.Id, "C172");
        var booking = (await booked.Content.ReadFromJsonAsync<BookingResponse>())!;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SkyBridgeDbContext>();
            var past = DateTime.UtcNow.AddMinutes(-1);
            await db.Bookings.Where(b => b.Id == booking.Id).ExecuteUpdateAsync(b => b.SetProperty(x => x.StartDeadlineUtc, past));
        }

        var current = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/bookings/current", pilot);
        var rebook = await BookAsync(pilot, route.Id, "C172");

        Assert.Equal(HttpStatusCode.NoContent, current.StatusCode);
        rebook.EnsureSuccessStatusCode();
    }

    private async Task<(string Icao, RouteResponse Route)> CreateRouteAsync(IReadOnlyList<string> aircraft, bool active = true, IReadOnlyList<string>? fleet = null)
    {
        var admin = await _client.LoginAsAdminAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", admin)).EnsureSuccessStatusCode();

        var icao = string.Concat(Enumerable.Range(0, 3).Select(_ => (char)('A' + Random.Shared.Next(26))));
        var created = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airlines", admin,
            new AirlineRequest($"Route Test {icao}", null, icao, null, "Brazil", active));
        created.EnsureSuccessStatusCode();
        var airline = (await created.Content.ReadFromJsonAsync<AirlineDetailResponse>())!;
        if (fleet is not null)
            (await _client.SendAuthorizedAsync(HttpMethod.Put, $"/api/admin/airlines/{airline.Id}/fleet", admin, new FleetRequest(fleet))).EnsureSuccessStatusCode();

        var route = await _client.SendAuthorizedAsync(HttpMethod.Post, $"/api/admin/airlines/{airline.Id}/routes", admin,
            new RouteRequest("SBFL", "SBGR", aircraft));
        route.EnsureSuccessStatusCode();
        return (icao, (await route.Content.ReadFromJsonAsync<RouteResponse>())!);
    }

    private async Task<string> PilotAtAsync(string airport)
    {
        var token = await _client.RegisterPilotAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pilot/jumpseat", token, new JumpseatRequest(airport))).EnsureSuccessStatusCode();
        return token;
    }

    private Task<HttpResponseMessage> BookAsync(string token, int routeId, string aircraft) =>
        _client.SendAuthorizedAsync(HttpMethod.Post, $"/api/bookings/routes/{routeId}", token, new AcceptJobRequest(aircraft));

    private async Task StartAsync(string token)
    {
        await _client.ImportMatchingPlanAsync(token);
        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/start", token);
        response.EnsureSuccessStatusCode();
        var booking = (await response.Content.ReadFromJsonAsync<BookingResponse>())!;

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SkyBridgeDbContext>();
        DateTime? started = DateTime.UtcNow.AddHours(-4);
        await db.Bookings.Where(b => b.Id == booking.Id).ExecuteUpdateAsync(b => b.SetProperty(x => x.LegStartedAtUtc, started));
    }

    private async Task<PirepFiledResponse> FileAsync(string token, int minutes)
    {
        var arrived = DateTime.UtcNow.AddMinutes(-30);
        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/pireps", token,
            new FilePirepRequest(arrived.AddMinutes(-minutes), arrived, 45, 160, null));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PirepFiledResponse>())!;
    }

    private static async Task<string> TextAsync(HttpResponseMessage response, HttpStatusCode expected)
    {
        Assert.Equal(expected, response.StatusCode);
        return await response.Content.ReadAsStringAsync();
    }

    private async Task<T> GetAsync<T>(string url, string token)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, url, token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }
}