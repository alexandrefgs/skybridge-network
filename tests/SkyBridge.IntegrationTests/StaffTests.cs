using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using SkyBridge.Application.Auth;
using SkyBridge.Application.Staff;
using SkyBridge.Domain.Staff;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class StaffTests(SkyBridgeApiFactory factory)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    private const string AdminUrl = "/api/admin/staff";
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Admin_FindsAPilot_AndAddsThemToThePublicStaffPage()
    {
        var (token, me) = await RegisterAsync();
        var admin = await _client.LoginAsAdminAsync();

        var candidates = await GetAsync<List<StaffCandidateResponse>>($"{AdminUrl}/candidates?search={me.Email}", admin);
        var saved = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{AdminUrl}/{me.Id}", admin,
            new StaffMemberRequest("  Director of Operations ", StaffDepartment.Operations, 2, false));
        var publicList = await _client.GetFromJsonAsync<List<PublicStaffResponse>>("/api/public/staff", Json);
        var adminList = await GetAsync<List<StaffMemberResponse>>(AdminUrl, admin);

        Assert.Equal((me.Id, false), (candidates.Single().UserId, candidates.Single().IsStaff));
        saved.EnsureSuccessStatusCode();
        var member = publicList!.Single(m => m.UserId == me.Id);
        Assert.Equal(("Marina Costa", "Director of Operations", StaffDepartment.Operations, 0, 0), (member.Name, member.Position, member.Department, member.Flights, member.FlightMinutes));
        Assert.Null(member.AvatarUrl);
        Assert.Contains(adminList, m => m.UserId == me.Id && m.Email == me.Email && m.SortOrder == 2);
        Assert.DoesNotContain("Staff", (await MeAsync(token)).Roles);
    }

    [Fact]
    public async Task PanelAccess_GrantsTheStaffRole_AndRemovingTheMemberTakesItBack()
    {
        var (token, me) = await RegisterAsync();
        var admin = await _client.LoginAsAdminAsync();

        await _client.SendAuthorizedAsync(HttpMethod.Put, $"{AdminUrl}/{me.Id}", admin, new StaffMemberRequest("PIREP reviewer", StaffDepartment.Safety, 1, true));
        var withAccess = await MeAsync(token);
        var candidates = await GetAsync<List<StaffCandidateResponse>>($"{AdminUrl}/candidates?search={me.Email}", admin);
        var removed = await _client.SendAuthorizedAsync(HttpMethod.Delete, $"{AdminUrl}/{me.Id}", admin);
        var again = await _client.SendAuthorizedAsync(HttpMethod.Delete, $"{AdminUrl}/{me.Id}", admin);
        var withoutAccess = await MeAsync(token);
        var publicList = await _client.GetFromJsonAsync<List<PublicStaffResponse>>("/api/public/staff", Json);

        Assert.Contains("Staff", withAccess.Roles);
        Assert.True(candidates.Single().IsStaff);
        Assert.Equal((HttpStatusCode.NoContent, HttpStatusCode.NotFound), (removed.StatusCode, again.StatusCode));
        Assert.DoesNotContain("Staff", withoutAccess.Roles);
        Assert.DoesNotContain(publicList!, m => m.UserId == me.Id);
    }

    [Fact]
    public async Task Save_UpdatesAnExistingMember()
    {
        var (_, me) = await RegisterAsync();
        var admin = await _client.LoginAsAdminAsync();

        await _client.SendAuthorizedAsync(HttpMethod.Put, $"{AdminUrl}/{me.Id}", admin, new StaffMemberRequest("Events Manager", StaffDepartment.Events, 4, false));
        var updated = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{AdminUrl}/{me.Id}", admin, new StaffMemberRequest("Head of Training", StaffDepartment.Training, 1, false));

        var body = (await updated.Content.ReadFromJsonAsync<StaffMemberResponse>(Json))!;
        Assert.Equal(("Head of Training", StaffDepartment.Training, 1), (body.Position, body.Department, body.SortOrder));
        var list = await GetAsync<List<StaffMemberResponse>>(AdminUrl, admin);
        Assert.Single(list, m => m.UserId == me.Id);
    }

    [Fact]
    public async Task Save_RejectsBadInput_AndUnknownUsers()
    {
        var (_, me) = await RegisterAsync();
        var admin = await _client.LoginAsAdminAsync();

        var shortPosition = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{AdminUrl}/{me.Id}", admin, new StaffMemberRequest("A", StaffDepartment.Executive, 0, false));
        var badDepartment = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{AdminUrl}/{me.Id}", admin, new StaffMemberRequest("CEO", (StaffDepartment)99, 0, false));
        var badOrder = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{AdminUrl}/{me.Id}", admin, new StaffMemberRequest("CEO", StaffDepartment.Executive, 5000, false));
        var unknown = await _client.SendAuthorizedAsync(HttpMethod.Put, $"{AdminUrl}/{Guid.NewGuid()}", admin, new StaffMemberRequest("CEO", StaffDepartment.Executive, 0, false));

        Assert.Equal(HttpStatusCode.BadRequest, shortPosition.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, badDepartment.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, badOrder.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
    }

    [Fact]
    public async Task StaffManagement_IsForAdminsOnly()
    {
        var pilot = await _client.RegisterPilotAsync();

        var list = await _client.SendAuthorizedAsync(HttpMethod.Get, AdminUrl, pilot);
        var anonymous = await _client.GetAsync(AdminUrl);
        var shortSearch = await GetAsync<List<StaffCandidateResponse>>($"{AdminUrl}/candidates?search=a", await _client.LoginAsAdminAsync());

        Assert.Equal(HttpStatusCode.Forbidden, list.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        Assert.Empty(shortSearch);
    }

    private async Task<(string Token, CurrentUserResponse Me)> RegisterAsync()
    {
        var email = $"{Guid.NewGuid():N}@skybridge.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("Marina", "Costa", email, TestAuth.Password));
        response.EnsureSuccessStatusCode();
        var token = (await response.Content.ReadFromJsonAsync<LoginResponse>(Json))!.AccessToken!;
        return (token, await MeAsync(token));
    }

    private async Task<CurrentUserResponse> MeAsync(string token) => await GetAsync<CurrentUserResponse>("/api/auth/me", token);

    private async Task<T> GetAsync<T>(string url, string token)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, url, token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>(Json))!;
    }
}