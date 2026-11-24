using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Airports;
using SkyBridge.Application.FlightPlans;
using Testcontainers.MsSql;

namespace SkyBridge.IntegrationTests.Infrastructure;

public sealed class SkyBridgeApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string AdminEmail = "admin@skybridge.test";
    public const string AdminPassword = "Admin!Pass2026";

    private readonly MsSqlContainer _sql = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var connectionString = new SqlConnectionStringBuilder(_sql.GetConnectionString())
        {
            InitialCatalog = "SkyBridgeTests"
        }.ConnectionString;

        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Default", connectionString);
        builder.UseSetting("Seed:ImportAirports", "false");
        builder.UseSetting("Seed:ImportAirlines", "false");
        builder.UseSetting("Seed:AdminEmail", AdminEmail);
        builder.UseSetting("Seed:AdminPassword", AdminPassword);
        builder.UseSetting("Maps:CartoApiKey", "test-carto-key");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IAirportSource>();
            services.AddSingleton<IAirportSource, FakeAirportSource>();
            services.RemoveAll<IAirlineSource>();
            services.AddSingleton<IAirlineSource, FakeAirlineSource>();
            services.RemoveAll<IRplSource>();
            services.AddSingleton<IRplSource, FakeRplSource>();
            services.RemoveAll<ISimBriefClient>();
            services.AddSingleton<ISimBriefClient, FakeSimBriefClient>();
        });
    }

    public Task InitializeAsync() => _sql.StartAsync();

    Task IAsyncLifetime.DisposeAsync() => _sql.DisposeAsync().AsTask();
}