using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SkyBridge.Application.Interfaces;
using SkyBridge.Application.Services;
using SkyBridge.Application.Validators;
using SkyBridge.Domain.Services;

namespace SkyBridge.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAirlineService, AirlineService>();
        services.AddScoped<IPilotService, PilotService>();
        services.AddScoped<IPirepService, PirepService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITourService, TourService>();
        services.AddScoped<IAwardService, AwardService>();
        services.AddScoped<IVooAtivoService, VooAtivoService>();
        services.AddScoped<ILandingEvaluator, LandingEvaluator>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IEstatisticasService, EstatisticasService>();

        services.AddValidatorsFromAssemblyContaining<RegistroPilotoDtoValidator>();

        return services;
    }
}