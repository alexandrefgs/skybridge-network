using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SkyBridge.Api.Filters;
using SkyBridge.Api.Options;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Auth;

namespace SkyBridge.Api.Controllers;

[ApiController]
[AllowInactiveAccount]
[Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("register")]
    [EnableRateLimiting(RateLimitOptions.AuthPolicy)]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await auth.RegisterAsync(request, cancellationToken);
        if (!result.Succeeded)
            return ValidationProblem(new ValidationProblemDetails(result.Errors));

        return Created("/api/auth/me", result.Value);
    }

    [HttpPost("login")]
    [EnableRateLimiting(RateLimitOptions.AuthPolicy)]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken) =>
        ToLoginResult(await auth.LoginAsync(request, cancellationToken));

    [HttpPost("login/2fa")]
    [EnableRateLimiting(RateLimitOptions.AuthPolicy)]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LoginWithTwoFactor(TwoFactorLoginRequest request, CancellationToken cancellationToken) =>
        ToLoginResult(await auth.LoginWithTwoFactorAsync(request, cancellationToken));

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var user = await auth.GetCurrentUserAsync(User.GetUserId(), cancellationToken);
        return user is null ? Unauthorized() : Ok(user);
    }

    private IActionResult ToLoginResult(AuthResult<LoginResponse> result) =>
        result.Succeeded
            ? Ok(result.Value)
            : Problem(statusCode: StatusCodes.Status401Unauthorized, title: result.Errors.Values.First()[0]);
}