using Microsoft.Extensions.DependencyInjection;
using SkyBridge.Application.Interfaces;
using SkyBridge.Application.Services;
using SkyBridge.Domain.Services;

namespace SkyBridge.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAirlineService, AirlineService>();
        services.AddScoped<IPilotService, PilotService>();
        services.AddScoped<IPirepService, PirepService>();
        services.AddScoped<ILandingEvaluator, LandingEvaluator>();

        return services;
    }
}