using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SkyBridge.Application.Account;

namespace SkyBridge.Infrastructure.Account;

internal sealed class AccountRetentionWorker(IServiceScopeFactory scopes, ILogger<AccountRetentionWorker> logger) : BackgroundService
{
    private static readonly TimeSpan FirstRun = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(FirstRun, stoppingToken);
            using var timer = new PeriodicTimer(Interval);
            do
            {
                await PurgeAsync(stoppingToken);
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    private async Task PurgeAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopes.CreateScope();
            var purged = await scope.ServiceProvider.GetRequiredService<IAccountLifecycle>().PurgeExpiredAsync(cancellationToken);
            if (purged > 0)
                logger.LogInformation("Deleted {Count} accounts inactive for more than 12 months.", purged);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(exception, "The account retention cleanup failed.");
        }
    }
}