using System.Collections.Concurrent;
using System.Net.Http.Json;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.FlightPlans;
using SkyBridge.Application.Pilots;
using SkyBridge.Domain.FlightPlans;

namespace SkyBridge.IntegrationTests.Infrastructure;

public sealed class FakeSimBriefClient : ISimBriefClient
{
    public static readonly ConcurrentDictionary<string, SimBriefResult> Latest = new();

    public Task<SimBriefResult> FetchLatestAsync(string pilotId, CancellationToken cancellationToken) =>
        Task.FromResult(Latest.TryGetValue(pilotId, out var result) ? result : SimBriefResult.Fail("Unknown UserID"));

    public static FlightPlanData Plan(string origin, string destination, string aircraft, DateTime? generatedAtUtc = null) =>
        new(Guid.NewGuid().ToString("N")[..12], generatedAtUtc ?? DateTime.UtcNow, "2611", origin, destination, null, aircraft, "PR-SKB", "SKB1",
            "DCT", 9000, 278, 120, 120, 110, 40, 70, 2, 20, 1000, 1110, 1040);
}

public static class TestFlightPlans
{
    public static async Task<string> LinkSimBriefAsync(this HttpClient client, string token)
    {
        var pilotId = Random.Shared.Next(1, 9_999_999).ToString();
        (await client.SendAuthorizedAsync(HttpMethod.Put, "/api/pilot/simbrief", token, new SimBriefLinkRequest(pilotId))).EnsureSuccessStatusCode();
        return pilotId;
    }

    public static async Task ImportMatchingPlanAsync(this HttpClient client, string token)
    {
        var current = await client.SendAuthorizedAsync(HttpMethod.Get, "/api/bookings/current", token);
        current.EnsureSuccessStatusCode();
        var booking = (await current.Content.ReadFromJsonAsync<BookingResponse>())!;

        var (origin, destination) = booking.Flight is { } flight
            ? (flight.Origin, flight.Destination)
            : (booking.Job!.Legs[booking.CurrentLeg - 1].Origin, booking.Job.Legs[booking.CurrentLeg - 1].Destination);

        var pilotId = await client.LinkSimBriefAsync(token);
        FakeSimBriefClient.Latest[pilotId] = new SimBriefResult(FakeSimBriefClient.Plan(origin, destination, booking.Aircraft), null);
        (await client.SendAuthorizedAsync(HttpMethod.Post, "/api/bookings/current/flight-plan", token)).EnsureSuccessStatusCode();
    }
}