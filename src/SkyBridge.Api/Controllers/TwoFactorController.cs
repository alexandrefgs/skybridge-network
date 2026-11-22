using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Auth;

namespace SkyBridge.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/auth/2fa")]
public class TwoFactorController(ITwoFactorService twoFactor) : ControllerBase
{
    [HttpPost("setup")]
    [ProducesResponseType<TwoFactorSetupResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Setup(CancellationToken cancellationToken)
    {
        var result = await twoFactor.SetupAsync(User.GetUserId(), cancellationToken);
        return result.Succeeded ? Ok(result.Value) : ValidationProblem(new ValidationProblemDetails(result.Errors));
    }

    [HttpPost("enable")]
    [ProducesResponseType<RecoveryCodesResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Enable(TwoFactorCodeRequest request, CancellationToken cancellationToken)
    {
        var result = await twoFactor.EnableAsync(User.GetUserId(), request.Code, cancellationToken);
        return result.Succeeded ? Ok(result.Value) : ValidationProblem(new ValidationProblemDetails(result.Errors));
    }

    [HttpPost("disable")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Disable(TwoFactorCodeRequest request, CancellationToken cancellationToken)
    {
        var result = await twoFactor.DisableAsync(User.GetUserId(), request.Code, cancellationToken);
        return result.Succeeded ? NoContent() : ValidationProblem(new ValidationProblemDetails(result.Errors));
    }
}