using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SkyBridge.Application.Auth;
using SkyBridge.Application.Profile;
using SkyBridge.Domain.Users;
using SkyBridge.IntegrationTests.Infrastructure;

namespace SkyBridge.IntegrationTests;

[Collection(ApiCollection.Name)]
public class ProfileTests(SkyBridgeApiFactory factory)
{
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x01, 0x02, 0x03];

    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task NewAccount_HasNoAvatar()
    {
        var token = await RegisterAsync();

        var me = await GetMeAsync(token);

        Assert.Null(me.AvatarUrl);
    }

    [Fact]
    public async Task UpdateProfile_RequiresAuthentication()
    {
        var response = await _client.PutAsJsonAsync("/api/account/profile", new UpdateProfileRequest("Ana", "Souza"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateProfile_ChangesTheName()
    {
        var token = await RegisterAsync();

        var response = await SendAsync(HttpMethod.Put, "/api/account/profile", token, JsonContent.Create(new UpdateProfileRequest("  Ana Clara ", "Souza")));

        response.EnsureSuccessStatusCode();
        var me = await GetMeAsync(token);
        Assert.Equal("Ana Clara", me.FirstName);
        Assert.Equal("Souza", me.LastName);
    }

    [Fact]
    public async Task UpdateProfile_Returns400_WithBlankName()
    {
        var token = await RegisterAsync();

        var response = await SendAsync(HttpMethod.Put, "/api/account/profile", token, JsonContent.Create(new UpdateProfileRequest(" ", "Souza")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SetAvatar_StoresThePictureAndServesIt()
    {
        var token = await RegisterAsync();

        var response = await UploadAsync(token, Png);

        response.EnsureSuccessStatusCode();
        var me = (await response.Content.ReadFromJsonAsync<CurrentUserResponse>())!;
        Assert.StartsWith($"/api/users/{me.Id}/avatar?v=", me.AvatarUrl);

        var avatar = await _client.GetAsync(me.AvatarUrl);
        avatar.EnsureSuccessStatusCode();
        Assert.Equal("image/png", avatar.Content.Headers.ContentType!.MediaType);
        Assert.Equal(Png, await avatar.Content.ReadAsByteArrayAsync());
        Assert.Contains("immutable", avatar.Headers.CacheControl!.ToString());
    }

    [Fact]
    public async Task SetAvatar_ReplacesThePreviousPicture()
    {
        var token = await RegisterAsync();
        await UploadAsync(token, Png);
        byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x09];

        var response = await UploadAsync(token, jpeg);

        var me = (await response.Content.ReadFromJsonAsync<CurrentUserResponse>())!;
        var avatar = await _client.GetAsync(me.AvatarUrl);
        Assert.Equal("image/jpeg", avatar.Content.Headers.ContentType!.MediaType);
        Assert.Equal(jpeg, await avatar.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task SetAvatar_Returns400_ForAFileThatIsNotAPicture()
    {
        var token = await RegisterAsync();

        var response = await UploadAsync(token, "<svg/>"u8.ToArray());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null((await GetMeAsync(token)).AvatarUrl);
    }

    [Fact]
    public async Task SetAvatar_Returns400_WhenThePictureIsTooBig()
    {
        var token = await RegisterAsync();
        var big = new byte[ProfileImage.MaxBytes + 1];
        Png.CopyTo(big, 0);

        var response = await UploadAsync(token, big);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RemoveAvatar_GoesBackToTheDefault()
    {
        var token = await RegisterAsync();
        var uploaded = (await (await UploadAsync(token, Png)).Content.ReadFromJsonAsync<CurrentUserResponse>())!;

        var response = await SendAsync(HttpMethod.Delete, "/api/account/avatar", token);

        response.EnsureSuccessStatusCode();
        Assert.Null((await GetMeAsync(token)).AvatarUrl);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync(uploaded.AvatarUrl)).StatusCode);
    }

    [Fact]
    public async Task Avatar_Returns404_ForUnknownUser()
    {
        var response = await _client.GetAsync($"/api/users/{Guid.NewGuid()}/avatar");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<string> RegisterAsync()
    {
        var email = $"{Guid.NewGuid():N}@skybridge.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("Ana", "Silva", email, "Sky!Bridge2026"));
        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return login!.AccessToken!;
    }

    private async Task<CurrentUserResponse> GetMeAsync(string token)
    {
        var response = await SendAsync(HttpMethod.Get, "/api/auth/me", token);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CurrentUserResponse>())!;
    }

    private Task<HttpResponseMessage> UploadAsync(string token, byte[] content)
    {
        var file = new ByteArrayContent(content);
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        var form = new MultipartFormDataContent { { file, "file", "avatar.png" } };
        return SendAsync(HttpMethod.Put, "/api/account/avatar", token, form);
    }

    private async Task<HttpResponseMessage> SendAsync(HttpMethod method, string url, string token, HttpContent? content = null)
    {
        using var request = new HttpRequestMessage(method, url) { Content = content };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await _client.SendAsync(request);
    }
}