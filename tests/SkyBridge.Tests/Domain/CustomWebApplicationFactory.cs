using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SkyBridge.Infrastructure.Data;

namespace SkyBridge.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnectionKeepAlive _keepAlive = new();

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            var descritoresParaRemover = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                         || d.ServiceType == typeof(DbContextOptions)
                         || d.ServiceType == typeof(IDbContextOptionsConfiguration<AppDbContext>)
                         || d.ServiceType == typeof(AppDbContext))
                .ToList();

            foreach (var descritor in descritoresParaRemover)
                services.Remove(descritor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(_keepAlive.Connection));

            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _keepAlive.Dispose();
    }
}

internal class SqliteConnectionKeepAlive : IDisposable
{
    public Microsoft.Data.Sqlite.SqliteConnection Connection { get; }

    public SqliteConnectionKeepAlive()
    {
        Connection = new Microsoft.Data.Sqlite.SqliteConnection("DataSource=:memory:");
        Connection.Open();
    }

    public void Dispose() => Connection.Dispose();
}