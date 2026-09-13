using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FSUIPC;

var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

Console.WriteLine("=== SkyBridge ACARS ===");
Console.Write("E-mail: ");
var email = Console.ReadLine() ?? string.Empty;
Console.Write("Senha: ");
var senha = Console.ReadLine() ?? string.Empty;

using var http = new HttpClient { BaseAddress = new Uri("http://localhost:5202") };

Console.WriteLine("Fazendo login...");
var loginResponse = await http.PostAsJsonAsync("/api/Auth/login", new { email, senha });
if (!loginResponse.IsSuccessStatusCode)
{
    Console.WriteLine("Falha no login. Verifique e-mail/senha.");
    return;
}

var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>(jsonOptions);
http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
Console.WriteLine($"Logado como {auth.Piloto.Callsign}.");

Console.WriteLine("Conectando ao FSUIPC...");
try
{
    FSUIPCConnection.Open();
    Console.WriteLine("Conectado! Enviando telemetria a cada 5 segundos. Pressione Ctrl+C para sair.");
}
catch (FSUIPCException ex)
{
    Console.WriteLine($"Falha ao conectar: {ex.Message}");
    return;
}

var altitude = new Offset<long>(0x0570);
var velocidade = new Offset<int>(0x02B8);
var velocidadeVertical = new Offset<short>(0x0842);
var noSolo = new Offset<short>(0x0366);
var latitude = new Offset<FsLatitude>(0x0560, 8);
var longitude = new Offset<FsLongitude>(0x0568, 8);
var headingOffset = new Offset<uint>(0x0580);

while (true)
{
    try
    {
        FSUIPCConnection.Process();

        var altitudePes = altitude.Value * 3.28084 / (65536.0 * 65536.0);
        var velocidadeNos = velocidade.Value / 128.0;
        var vsFpm = Math.Round(velocidadeVertical.Value * 3.28084 * -1);
        var heading = headingOffset.Value * 360.0 / (65536.0 * 65536.0);
        var lat = latitude.Value.DecimalDegrees;
        var lon = longitude.Value.DecimalDegrees;
        var estaNoSolo = noSolo.Value != 0;

        Console.WriteLine($"Lat: {lat:F4} | Lon: {lon:F4} | Altitude: {altitudePes:F0} ft | Velocidade: {velocidadeNos:F0} kt | V/S: {vsFpm} fpm | No solo: {estaNoSolo}");

        var telemetria = new { latitude = lat, longitude = lon, altitudePes, velocidadeNos, heading, estaNoSolo, velocidadeVerticalFpm = vsFpm };        var envio = await http.PostAsJsonAsync("/api/VoosAtivos/telemetria", telemetria);
        if (!envio.IsSuccessStatusCode)
            Console.WriteLine($"Falha ao enviar telemetria: {envio.StatusCode}");
    }
    catch (FSUIPCException ex)
    {
        Console.WriteLine($"Erro de leitura: {ex.Message}");
    }

    await Task.Delay(5000);
}

record PilotoResumo(int Id, string Nome, string Callsign, double Rating, long PontosTotais);
record AuthResponse(string Token, DateTime ExpiraEm, string RefreshToken, PilotoResumo Piloto);