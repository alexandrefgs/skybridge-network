using System.Net.Http.Headers;
using System.Net.Http.Json;
using SkyBridge.Application.Auth;

namespace SkyBridge.IntegrationTests.Infrastructure;

public static class TestAuth
{
    public const string Password = "Sky!Bridge2026";

    public static async Task<string> LoginAsAdminAsync(this HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(SkyBridgeApiFactory.AdminEmail, SkyBridgeApiFactory.AdminPassword));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<LoginResponse>())!.AccessToken!;
    }

    public static async Task<string> RegisterPilotAsync(this HttpClient client)
    {
        var email = $"{Guid.NewGuid():N}@skybridge.test";
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("Ana", "Silva", email, Password));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<LoginResponse>())!.AccessToken!;
    }

    public static async Task<HttpResponseMessage> SendAuthorizedAsync(this HttpClient client, HttpMethod method, string url, string token, object? body = null)
    {
        using var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (body is not null)
            request.Content = JsonContent.Create(body);
        return await client.SendAsync(request);
    }
}