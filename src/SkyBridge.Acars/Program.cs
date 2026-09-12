using FSUIPC;

Console.WriteLine("Conectando ao FSUIPC...");

try
{
    FSUIPCConnection.Open();
    Console.WriteLine("Conectado! Pressione Ctrl+C para sair.");
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

while (true)
{
    try
    {
        FSUIPCConnection.Process();

        var altitudePes = Math.Round(altitude.Value * 3.28084 / (65536.0 * 65536.0));
        var velocidadeNos = Math.Round(velocidade.Value / 128.0);
        var vsFpm = Math.Round(velocidadeVertical.Value * 3.28084 * -1);
        var estaNoSolo = noSolo.Value != 0;

        Console.WriteLine($"Altitude: {altitudePes} ft | Velocidade: {velocidadeNos} kt | V/S: {vsFpm} fpm | No solo: {estaNoSolo}");
    }
    catch (FSUIPCException ex)
    {
        Console.WriteLine($"Erro de leitura: {ex.Message}");
    }

    Thread.Sleep(1000);
}