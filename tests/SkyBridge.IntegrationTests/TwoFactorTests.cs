using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using OtpNet;
using SkyBridge.Application.Auth;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class TwoFactorTests(SkyBridgeApiFactory factory)
{
    private const string Password = "Sky!Bridge2026";
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Setup_RequiresAuthentication()
    {
        var response = await _client.PostAsync("/api/auth/2fa/setup", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Setup_ReturnsSharedKeyAndAuthenticatorUri()
    {
        var (email, token) = await RegisterAsync();

        var response = await PostAuthorizedAsync("/api/auth/2fa/setup", token);

        response.EnsureSuccessStatusCode();
        var setup = await response.Content.ReadFromJsonAsync<TwoFactorSetupResponse>();
        Assert.False(string.IsNullOrWhiteSpace(setup!.SharedKey));
        Assert.StartsWith($"otpauth://totp/SkyBridge:{Uri.EscapeDataString(email)}?secret=", setup.AuthenticatorUri);
    }

    [Fact]
    public async Task Enable_Returns400_WithInvalidCode()
    {
        var (_, token) = await RegisterAsync();
        await PostAuthorizedAsync("/api/auth/2fa/setup", token);

        var response = await PostAuthorizedAsync("/api/auth/2fa/enable", token, new TwoFactorCodeRequest("000000"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Enable_ReturnsTenRecoveryCodes()
    {
        var (_, _, recoveryCodes) = await RegisterWithTwoFactorAsync();

        Assert.Equal(10, recoveryCodes.Count);
    }

    [Fact]
    public async Task Login_RequiresSecondStep_WhenTwoFactorIsEnabled()
    {
        var (email, _, _) = await RegisterWithTwoFactorAsync();

        var login = await LoginAsync(email);

        Assert.True(login.RequiresTwoFactor);
        Assert.Null(login.AccessToken);
        Assert.False(string.IsNullOrWhiteSpace(login.TwoFactorToken));
    }

    [Fact]
    public async Task LoginTwoFactor_ReturnsToken_WithAuthenticatorCode()
    {
        var (email, key, _) = await RegisterWithTwoFactorAsync();
        var login = await LoginAsync(email);

        var response = await _client.PostAsJsonAsync("/api/auth/login/2fa", new TwoFactorLoginRequest(login.TwoFactorToken!, CurrentCode(key)));

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.False(string.IsNullOrWhiteSpace(result!.AccessToken));
    }

    [Fact]
    public async Task LoginTwoFactor_AcceptsRecoveryCodeOnlyOnce()
    {
        var (email, _, recoveryCodes) = await RegisterWithTwoFactorAsync();

        var first = await _client.PostAsJsonAsync("/api/auth/login/2fa", new TwoFactorLoginRequest((await LoginAsync(email)).TwoFactorToken!, recoveryCodes[0]));
        var second = await _client.PostAsJsonAsync("/api/auth/login/2fa", new TwoFactorLoginRequest((await LoginAsync(email)).TwoFactorToken!, recoveryCodes[0]));

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, second.StatusCode);
    }

    [Fact]
    public async Task LoginTwoFactor_Returns401_WithInvalidCode()
    {
        var (email, _, _) = await RegisterWithTwoFactorAsync();
        var login = await LoginAsync(email);

        var response = await _client.PostAsJsonAsync("/api/auth/login/2fa", new TwoFactorLoginRequest(login.TwoFactorToken!, "000000"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task LoginTwoFactor_Returns401_WithTamperedToken()
    {
        var (_, key, _) = await RegisterWithTwoFactorAsync();

        var response = await _client.PostAsJsonAsync("/api/auth/login/2fa", new TwoFactorLoginRequest("tampered-token", CurrentCode(key)));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Disable_TurnsOffSecondStep()
    {
        var (email, key, _) = await RegisterWithTwoFactorAsync();
        var login = await LoginAsync(email);
        var signedIn = await (await _client.PostAsJsonAsync("/api/auth/login/2fa", new TwoFactorLoginRequest(login.TwoFactorToken!, CurrentCode(key))))
            .Content.ReadFromJsonAsync<LoginResponse>();

        var response = await PostAuthorizedAsync("/api/auth/2fa/disable", signedIn!.AccessToken!, new TwoFactorCodeRequest(CurrentCode(key)));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var again = await LoginAsync(email);
        Assert.False(again.RequiresTwoFactor);
        Assert.False(string.IsNullOrWhiteSpace(again.AccessToken));
    }

    private async Task<(string Email, string Token)> RegisterAsync()
    {
        var email = $"{Guid.NewGuid():N}@skybridge.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("Ana", "Silva", email, Password));
        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return (email, login!.AccessToken!);
    }

    private async Task<(string Email, string SharedKey, IReadOnlyList<string> RecoveryCodes)> RegisterWithTwoFactorAsync()
    {
        var (email, token) = await RegisterAsync();
        var setup = await (await PostAuthorizedAsync("/api/auth/2fa/setup", token)).Content.ReadFromJsonAsync<TwoFactorSetupResponse>();
        var enable = await PostAuthorizedAsync("/api/auth/2fa/enable", token, new TwoFactorCodeRequest(CurrentCode(setup!.SharedKey)));
        enable.EnsureSuccessStatusCode();
        var codes = await enable.Content.ReadFromJsonAsync<RecoveryCodesResponse>();
        return (email, setup.SharedKey, codes!.RecoveryCodes);
    }

    private async Task<LoginResponse> LoginAsync(string email)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, Password));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<LoginResponse>())!;
    }

    private async Task<HttpResponseMessage> PostAuthorizedAsync(string url, string token, object? body = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = JsonContent.Create(body ?? new { }) };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await _client.SendAsync(request);
    }

    private static string CurrentCode(string sharedKey) =>
        new Totp(Base32Encoding.ToBytes(sharedKey.Replace(" ", string.Empty).ToUpperInvariant())).ComputeTotp();
}