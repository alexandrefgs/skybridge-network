using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SkyBridge.Api.Extensions;
using SkyBridge.Application.Account;

namespace SkyBridge.Api.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class AllowInactiveAccountAttribute : Attribute;

public sealed class ActiveAccountFilter(IAccountLifecycle lifecycle) : IAsyncActionFilter
{
    public const string InactiveMessage = "Your account is inactive. Reactivate it to continue.";

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var metadata = context.ActionDescriptor.EndpointMetadata;
        var skip = context.HttpContext.User.Identity?.IsAuthenticated != true
            || metadata.OfType<IAllowAnonymous>().Any()
            || metadata.OfType<AllowInactiveAccountAttribute>().Any();

        if (skip || await lifecycle.IsActiveAsync(context.HttpContext.User.GetUserId(), context.HttpContext.RequestAborted))
        {
            await next();
            return;
        }

        context.Result = new ObjectResult(new ProblemDetails
        {
            Status = StatusCodes.Status403Forbidden,
            Title = InactiveMessage
        })
        { StatusCode = StatusCodes.Status403Forbidden };
    }
}