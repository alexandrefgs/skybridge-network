using System.Net;
using System.Net.Http.Json;
using SkyBridge.Application.Common;
using SkyBridge.Application.Freelance;
using SkyBridge.Domain.Freelance;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class FreelanceTests(SkyBridgeApiFactory factory)
{
    private const string AdminUrl = "/api/admin/freelance";
    private readonly HttpClient _client = factory.CreateClient();

    private static FreelanceLegRequest Leg(string origin, string destination) =>
        new(origin, destination, 2, 150, ["Maria Souza"], [new DangerousGoodRequest("Medical oxygen", DangerousGoodClass.Gases, 20, "1072")]);

    private static FreelanceJobRequest Medevac(string origin = "SBFL", string destination = "SBGR", params string[] aircraft) =>
        new(FreelanceJobKind.Medevac, 4500, DateTime.UtcNow.AddDays(3),
            aircraft.Length == 0 ? ["C208"] : aircraft,
            [Leg(origin, destination)],
            "Hospital Santa Catarina", "A patient needs urgent transfer to a burn unit in São Paulo.");

    [Fact]
    public async Task Create_Returns403_ForPilots()
    {
        var token = await _client.RegisterPilotAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, token, Medevac());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_KeepsTheBriefing_AndPilotsSeeTheJobFromItsOrigin()
    {
        var admin = await ImportAirportsAsync();

        var created = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin, Medevac());

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var job = (await created.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;
        Assert.Equal(("Medevac", "SBFL", "SBGR", "Hospital Santa Catarina"), (job.Kind, job.Origin, job.Destination, job.Client));
        var leg = Assert.Single(job.Legs);
        Assert.Equal((1, 2, 150), (leg.Sequence, leg.PassengerCount, leg.CargoKg));
        Assert.Equal(new[] { "Maria Souza" }, leg.PassengerNames);
        Assert.Equal(new DangerousGoodResponse("Medical oxygen", "Gases", 20, "UN1072"), Assert.Single(leg.DangerousGoods));
        Assert.InRange(job.DistanceNm, 270, 290);

        var pilot = await _client.RegisterPilotAsync();
        var fromFlorianopolis = await GetAsync<PagedResult<FreelanceJobResponse>>("/api/freelance?from=SBFL&pageSize=100", pilot);
        var fromGuarulhos = await GetAsync<PagedResult<FreelanceJobResponse>>("/api/freelance?from=SBGR&pageSize=100", pilot);
        Assert.Contains(fromFlorianopolis.Items, j => j.Id == job.Id);
        Assert.DoesNotContain(fromGuarulhos.Items, j => j.Id == job.Id);
    }

    [Fact]
    public async Task Create_WithSeveralLegs_ShowsTheWholeRoute()
    {
        var admin = await ImportAirportsAsync();
        var request = Medevac() with
        {
            Kind = FreelanceJobKind.Executive,
            Legs = [Leg("SBFL", "SBGR"), Leg("SBGR", "SSKT") with { PassengerCount = 0, PassengerNames = [] }, Leg("SSKT", "SBFL")]
        };

        var created = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin, request);

        var job = (await created.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;
        Assert.Equal(("SBFL", "SBFL"), (job.Origin, job.Destination));
        Assert.Equal(new[] { "SBFL-SBGR", "SBGR-SSKT", "SSKT-SBFL" }, job.Legs.Select(l => $"{l.Origin}-{l.Destination}"));
        Assert.Equal(0, job.Legs[1].PassengerCount);
        Assert.Equal(job.Legs.Sum(l => l.DistanceNm), job.DistanceNm);
    }

    [Fact]
    public async Task Create_Returns400_WhenLegsAreNotChained()
    {
        var admin = await ImportAirportsAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin,
            Medevac() with { Legs = [Leg("SBFL", "SBGR"), Leg("SSKT", "SBFL")] });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Leg 2 must depart from SBGR", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Create_WarnsWhenTheAircraftDoesNotFitTheRunway()
    {
        var admin = await ImportAirportsAsync();

        var created = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin, Medevac("SBGR", "SSKT", "B738", "C208"));

        var job = (await created.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;
        Assert.Equal(new[] { "B738", "C208" }, job.Aircraft);
        Assert.Equal(new[] { "B738 needs 4,300 ft, SSKT longest runway is 2,500 ft" }, job.Warnings);
    }

    [Fact]
    public async Task Create_AllowsSkydiving_FromAndToTheSameAirport()
    {
        var admin = await ImportAirportsAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin,
            Medevac("SSKT", "SSKT") with { Kind = FreelanceJobKind.Skydiving });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var job = (await response.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;
        Assert.Equal(("Skydiving", 0), (job.Kind, job.DistanceNm));
    }

    [Theory]
    [InlineData("SBFL", "SBFL", "C208")]
    [InlineData("SBFL", "ZZZZ", "C208")]
    [InlineData("SBFL", "SBGR", "ZZZZ")]
    public async Task Create_Returns400_ForInvalidAirportsOrAircraft(string origin, string destination, string aircraft)
    {
        var admin = await ImportAirportsAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin, Medevac(origin, destination, aircraft));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_Returns400_ForPastExpiryNamesOrUnNumber()
    {
        var admin = await ImportAirportsAsync();

        var past = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin, Medevac() with { ExpiresAtUtc = DateTime.UtcNow.AddMinutes(-1) });
        var names = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin,
            Medevac() with { Legs = [Leg("SBFL", "SBGR") with { PassengerCount = 0 }] });
        var badUn = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin,
            Medevac() with { Legs = [Leg("SBFL", "SBGR") with { DangerousGoods = [new DangerousGoodRequest("Fuel", DangerousGoodClass.FlammableLiquids, 10, "12")] }] });
        var noLegs = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin, Medevac() with { Legs = [] });

        Assert.Equal(HttpStatusCode.BadRequest, past.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, names.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, badUn.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, noLegs.StatusCode);
    }

    [Fact]
    public async Task Update_AndDelete_Work()
    {
        var admin = await ImportAirportsAsync();
        var created = await _client.SendAuthorizedAsync(HttpMethod.Post, AdminUrl, admin, Medevac());
        var job = (await created.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;

        var updated = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{AdminUrl}/{job.Id}", admin,
            Medevac() with
            {
                Kind = FreelanceJobKind.Repatriation,
                Reward = 9000,
                Legs = [new FreelanceLegRequest("SBGR", "SBFL", 120, 0), new FreelanceLegRequest("SBFL", "SSKT", 4, 0)]
            });
        var edited = (await updated.Content.ReadFromJsonAsync<FreelanceJobResponse>())!;
        Assert.Equal(("Repatriation", 9000, "SBGR", "SSKT"), (edited.Kind, edited.Reward, edited.Origin, edited.Destination));
        Assert.Equal(new[] { 120, 4 }, edited.Legs.Select(l => l.PassengerCount));
        Assert.All(edited.Legs, l => Assert.Empty(l.DangerousGoods));

        var deleted = await _client.SendAuthorizedAsync(HttpMethod.Delete, $"{AdminUrl}/{job.Id}", admin);
        var again = await _client.SendAuthorizedAsync(HttpMethod.Delete, $"{AdminUrl}/{job.Id}", admin);
        var detail = await _client.SendAuthorizedAsync(HttpMethod.Get, $"/api/freelance/{job.Id}", await _client.RegisterPilotAsync());

        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, again.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, detail.StatusCode);
    }

    private async Task<string> ImportAirportsAsync()
    {
        var token = await _client.LoginAsAdminAsync();
        (await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/admin/airports/import", token)).EnsureSuccessStatusCode();
        return token;
    }

    private async Task<T> GetAsync<T>(string url, string token)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, url, token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }
}