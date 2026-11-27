using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SkyBridge.Application.Account;
using SkyBridge.Application.Aircraft;
using SkyBridge.Application.Airlines;
using SkyBridge.Application.Airports;
using SkyBridge.Infrastructure.Account;
using SkyBridge.Infrastructure.Aircraft;
using SkyBridge.Infrastructure.Airlines;
using SkyBridge.Application.Auth;
using SkyBridge.Application.Bookings;
using SkyBridge.Application.FlightPlans;
using SkyBridge.Application.Freelance;
using SkyBridge.Application.Pilots;
using SkyBridge.Application.Pireps;
using SkyBridge.Application.Profile;
using SkyBridge.Application.Public;
using SkyBridge.Application.Staff;
using SkyBridge.Infrastructure.Airports;
using SkyBridge.Infrastructure.Auth;
using SkyBridge.Infrastructure.Identity;
using SkyBridge.Infrastructure.Bookings;
using SkyBridge.Infrastructure.FlightPlans;
using SkyBridge.Infrastructure.Freelance;
using SkyBridge.Infrastructure.Persistence;
using SkyBridge.Infrastructure.Pireps;
using SkyBridge.Infrastructure.Pilots;
using SkyBridge.Infrastructure.Profile;
using SkyBridge.Infrastructure.Public;
using SkyBridge.Infrastructure.Staff;

namespace SkyBridge.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' not found.");

        services.AddDbContext<SkyBridgeDbContext>(options => options.UseSqlServer(connectionString));
        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<SkyBridgeDbContext>()
            .AddDefaultTokenProviders();
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>>((options, jwtOptions) =>
            {
                var jwt = jwtOptions.Value;
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    ValidateIssuerSigningKey = true,
                    NameClaimType = "name",
                    RoleClaimType = "role",
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });
        services.AddAuthorization();
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<JwtTokenService>();
        services.AddScoped<CurrentUserReader>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<ITwoFactorService, TwoFactorService>();
        var dataProtection = services.AddDataProtection().SetApplicationName("SkyBridge");
        if (configuration["DataProtection:KeysPath"] is { Length: > 0 } keysPath)
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keysPath));
        services.AddSingleton<TwoFactorLoginTokens>();
        services.Configure<SeedOptions>(configuration.GetSection(SeedOptions.SectionName));
        services.AddScoped<IAirportQueries, AirportQueries>();
        services.AddScoped<IAircraftCatalog, AircraftCatalog>();
        services.AddScoped<IAirportImporter, AirportImporter>();
        services.AddScoped<IRunwayImporter, RunwayImporter>();
        services.AddScoped<IPilotService, PilotService>();
        services.AddScoped<IFreelanceQueries, FreelanceQueries>();
        services.AddScoped<IFreelanceAdmin, FreelanceAdmin>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<PirepMapper>();
        services.AddScoped<RewardPayer>();
        services.AddScoped<IPirepService, PirepService>();
        services.AddScoped<IPirepReview, PirepReview>();
        services.AddHttpClient<IAirportSource, OurAirportsSource>(client =>
        {
            client.BaseAddress = new Uri("https://davidmegginson.github.io/ourairports-data/");
            client.Timeout = TimeSpan.FromMinutes(2);
        });
        services.AddScoped<IAirlineQueries, AirlineQueries>();
        services.AddScoped<IAirlineAdmin, AirlineAdmin>();
        services.AddScoped<IAirlineImporter, AirlineImporter>();
        services.AddHttpClient<IAirlineSource, OpenFlightsSource>(client =>
        {
            client.BaseAddress = new Uri("https://raw.githubusercontent.com/jpatokal/openflights/master/data/");
            client.Timeout = TimeSpan.FromMinutes(2);
        });
        services.AddHttpClient<IRplSource, CgnaRplSource>(client =>
        {
            client.BaseAddress = new Uri("https://portal.cgna.decea.mil.br/files/abas/");
            client.Timeout = TimeSpan.FromMinutes(1);
        });
        services.AddHttpClient<ISimBriefClient, SimBriefClient>(client =>
        {
            client.BaseAddress = new Uri("https://www.simbrief.com/");
            client.Timeout = TimeSpan.FromSeconds(20);
        });
        services.AddMemoryCache();
        services.AddHttpClient(OnlineNetworks.Vatsim, client =>
        {
            client.BaseAddress = new Uri("https://data.vatsim.net/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddHttpClient(OnlineNetworks.Ivao, client =>
        {
            client.BaseAddress = new Uri("https://api.ivao.aero/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddSingleton<IOnlineNetworks, OnlineNetworks>();
        services.AddScoped<IPublicQueries, PublicQueries>();
        services.AddScoped<IStaffDirectory, StaffDirectory>();
        services.AddScoped<IAccountLifecycle, AccountLifecycle>();
        services.AddHostedService<AccountRetentionWorker>();
        services.AddHealthChecks().AddDbContextCheck<SkyBridgeDbContext>();
        return services;
    }
}