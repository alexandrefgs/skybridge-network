using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SkyBridge.Api.Filters;
using SkyBridge.Application.Account;
using SkyBridge.Application.Auth;
using SkyBridge.Application.Legal;
using SkyBridge.Domain.Users;
using SkyBridge.Infrastructure.Persistence;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class AccountTests(SkyBridgeApiFactory factory)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };
    private const string StatusUrl = "/api/account/status";
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task NewPilot_IsActive_AndMustAcceptTheRegulations()
    {
        var (token, _) = await RegisterAsync();

        var status = await GetStatusAsync(token);

        Assert.Equal((AccountStatus.Active, (int?)null, RegulationsCatalog.Current.Version), (status.Status, status.AcceptedRegulationsVersion, status.CurrentRegulationsVersion));
        Assert.Equal(RegulationsCatalog.History.Count, status.PendingRegulations.Count);
    }

    [Fact]
    public async Task AcceptRegulations_OnlyTakesTheCurrentVersion()
    {
        var (token, _) = await RegisterAsync();

        var old = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/account/regulations/accept", token, new AcceptRegulationsRequest(RegulationsCatalog.Current.Version + 1));
        var accepted = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/account/regulations/accept", token, new AcceptRegulationsRequest(RegulationsCatalog.Current.Version));

        Assert.Equal(HttpStatusCode.BadRequest, old.StatusCode);
        accepted.EnsureSuccessStatusCode();
        var status = await GetStatusAsync(token);
        Assert.Equal(RegulationsCatalog.Current.Version, status.AcceptedRegulationsVersion);
        Assert.Empty(status.PendingRegulations);
    }

    [Fact]
    public async Task IdlePilot_BecomesInactive_AndReactivatesAfterTenMinutes()
    {
        var (token, email) = await RegisterAsync();
        await UpdateUserAsync(email, DateTime.UtcNow.AddDays(-61), null);

        var inactive = await GetStatusAsync(token);
        var started = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/account/reactivate", token);
        var twice = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/account/reactivate", token);
        var preparing = (await started.Content.ReadFromJsonAsync<AccountStatusResponse>(Json))!;

        Assert.Equal(AccountStatus.Inactive, inactive.Status);
        Assert.Equal(AccountStatus.Reactivating, preparing.Status);
        Assert.InRange(preparing.ReactivationReadyAtUtc!.Value, DateTime.UtcNow.AddMinutes(9), DateTime.UtcNow.AddMinutes(11));
        Assert.Equal(HttpStatusCode.Conflict, twice.StatusCode);

        await UpdateUserAsync(email, DateTime.UtcNow.AddDays(-61), DateTime.UtcNow.AddMinutes(-1));
        var active = await GetStatusAsync(token);
        var again = await _client.SendAuthorizedAsync(HttpMethod.Post, "/api/account/reactivate", token);

        Assert.Equal((AccountStatus.Active, (DateTime?)null), (active.Status, active.ReactivationReadyAtUtc));
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
    }

    [Fact]
    public async Task InactivePilot_CanOnlyUseTheAccountEndpoints_UntilReactivated()
    {
        var (token, email) = await RegisterAsync();
        await UpdateUserAsync(email, DateTime.UtcNow.AddDays(-61), null);

        var blocked = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/pilot", token);
        var problem = await blocked.Content.ReadFromJsonAsync<ProblemDetails>(Json);
        var status = await _client.SendAuthorizedAsync(HttpMethod.Get, StatusUrl, token);
        var me = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/auth/me", token);
        var config = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/config/client", token);

        Assert.Equal(HttpStatusCode.Forbidden, blocked.StatusCode);
        Assert.Equal(ActiveAccountFilter.InactiveMessage, problem!.Title);
        Assert.Equal((HttpStatusCode.OK, HttpStatusCode.OK, HttpStatusCode.OK), (status.StatusCode, me.StatusCode, config.StatusCode));

        await UpdateUserAsync(email, DateTime.UtcNow.AddDays(-61), DateTime.UtcNow.AddMinutes(-1));
        var allowed = await _client.SendAuthorizedAsync(HttpMethod.Get, "/api/pilot", token);

        Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
    }

    [Fact]
    public async Task Delete_NeedsThePassword_AndRemovesTheAccount()
    {
        var (token, email) = await RegisterAsync();

        var wrong = await _client.SendAuthorizedAsync(HttpMethod.Delete, "/api/account", token, new DeleteAccountRequest("not-my-password"));
        var deleted = await _client.SendAuthorizedAsync(HttpMethod.Delete, "/api/account", token, new DeleteAccountRequest(TestAuth.Password));
        var login = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, TestAuth.Password));

        Assert.Equal(HttpStatusCode.BadRequest, wrong.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.False(login.IsSuccessStatusCode);
        Assert.False(await UserExistsAsync(email));
    }

    [Fact]
    public async Task Delete_IsNotForAdmins()
    {
        var admin = await _client.LoginAsAdminAsync();

        var response = await _client.SendAuthorizedAsync(HttpMethod.Delete, "/api/account", admin, new DeleteAccountRequest(SkyBridgeApiFactory.AdminPassword));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Purge_DeletesAccountsIdleForMoreThanTwelveMonths()
    {
        var (_, expired) = await RegisterAsync();
        var (_, recent) = await RegisterAsync();
        await UpdateUserAsync(expired, DateTime.UtcNow.AddDays(-400), null);
        await UpdateUserAsync(recent, DateTime.UtcNow.AddDays(-300), null);

        using (var scope = factory.Services.CreateScope())
            await scope.ServiceProvider.GetRequiredService<IAccountLifecycle>().PurgeExpiredAsync(CancellationToken.None);

        Assert.False(await UserExistsAsync(expired));
        Assert.True(await UserExistsAsync(recent));
        Assert.True(await UserExistsAsync(SkyBridgeApiFactory.AdminEmail));
    }

    [Fact]
    public async Task Regulations_AreOpenToVisitors()
    {
        var regulations = await _client.GetFromJsonAsync<RegulationsResponse>("/api/public/regulations", Json);

        Assert.Equal(RegulationsCatalog.Current.Version, regulations!.CurrentVersion);
        Assert.Equal(RegulationsCatalog.History.Count, regulations.History.Count);
    }

    private async Task<(string Token, string Email)> RegisterAsync()
    {
        var email = $"{Guid.NewGuid():N}@skybridge.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("Lucas", "Prado", email, TestAuth.Password));
        response.EnsureSuccessStatusCode();
        return ((await response.Content.ReadFromJsonAsync<LoginResponse>(Json))!.AccessToken!, email);
    }

    private async Task<AccountStatusResponse> GetStatusAsync(string token)
    {
        var response = await _client.SendAuthorizedAsync(HttpMethod.Get, StatusUrl, token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AccountStatusResponse>(Json))!;
    }

    private async Task UpdateUserAsync(string email, DateTime lastActiveAtUtc, DateTime? reactivationReadyAtUtc)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SkyBridgeDbContext>();
        await db.Users.Where(u => u.Email == email).ExecuteUpdateAsync(u => u
            .SetProperty(x => x.LastActiveAtUtc, lastActiveAtUtc)
            .SetProperty(x => x.ReactivationReadyAtUtc, reactivationReadyAtUtc));
    }

    private async Task<bool> UserExistsAsync(string email)
    {
        using var scope = factory.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<SkyBridgeDbContext>().Users.AnyAsync(u => u.Email == email);
    }
}