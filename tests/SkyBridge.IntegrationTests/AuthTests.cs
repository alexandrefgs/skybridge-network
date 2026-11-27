using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using SkyBridge.Application.Auth;
using SkyBridge.Domain.Users;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class AuthTests(SkyBridgeApiFactory factory)
{
    private const string ValidPassword = "Sky!Bridge2026";
    private readonly HttpClient _client = factory.CreateClient();

    private static string NewEmail() => $"{Guid.NewGuid():N}@skybridge.test";

    private Task<HttpResponseMessage> RegisterAsync(string email, string password = ValidPassword) =>
        _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("Ana", "Silva", email, password));

    private Task<HttpResponseMessage> LoginAsync(string email, string password) =>
        _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
    
    [Fact]
    public async Task Login_IsRateLimited_PerAddress()
    {
        using var limited = factory.WithWebHostBuilder(builder => builder.UseSetting("RateLimiting:AuthPermitPerMinute", "2"));
        var client = limited.CreateClient();
        var request = new LoginRequest(NewEmail(), "Wrong!Pass2026");

        var first = await client.PostAsJsonAsync("/api/auth/login", request);
        var second = await client.PostAsJsonAsync("/api/auth/login", request);
        var third = await client.PostAsJsonAsync("/api/auth/login", request);

        Assert.NotEqual(HttpStatusCode.TooManyRequests, first.StatusCode);
        Assert.NotEqual(HttpStatusCode.TooManyRequests, second.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, third.StatusCode);
    }

    [Fact]
    public async Task Register_ReturnsToken_ForNewPilot()
    {
        var response = await RegisterAsync(NewEmail());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.False(string.IsNullOrWhiteSpace(auth!.AccessToken));
    }

    [Fact]
    public async Task Register_Returns400_WhenEmailAlreadyExists()
    {
        var email = NewEmail();
        await RegisterAsync(email);

        var response = await RegisterAsync(email);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_Returns400_WhenPasswordIsWeak()
    {
        var response = await RegisterAsync(NewEmail(), "123");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_Returns400_WhenEmailIsInvalid()
    {
        var response = await RegisterAsync("not-an-email");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_ReturnsToken_WithValidCredentials()
    {
        var email = NewEmail();
        await RegisterAsync(email);

        var response = await LoginAsync(email, ValidPassword);

        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.False(string.IsNullOrWhiteSpace(auth!.AccessToken));
    }

    [Fact]
    public async Task Login_Returns401_WithWrongPassword()
    {
        var email = NewEmail();
        await RegisterAsync(email);

        var response = await LoginAsync(email, "Wrong!Pass123");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_Returns401_ForUnknownEmail()
    {
        var response = await LoginAsync(NewEmail(), ValidPassword);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_LocksAccount_AfterFiveFailedAttempts()
    {
        var email = NewEmail();
        await RegisterAsync(email);
        for (var i = 0; i < 5; i++)
            await LoginAsync(email, "Wrong!Pass123");

        var response = await LoginAsync(email, ValidPassword);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_ReturnsProfileWithPilotRole_WhenAuthenticated()
    {
        var email = NewEmail();
        var auth = await (await RegisterAsync(email)).Content.ReadFromJsonAsync<AuthResponse>();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var response = await _client.SendAsync(request);

        response.EnsureSuccessStatusCode();
        var me = await response.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.Equal(email, me!.Email);
        Assert.Equal("Ana", me.FirstName);
        Assert.Contains(Roles.Pilot, me.Roles);
    }

    [Fact]
    public async Task Me_Returns401_WithoutToken()
    {
        var response = await _client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}