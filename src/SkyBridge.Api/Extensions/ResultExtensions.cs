using Microsoft.AspNetCore.Mvc;
using SkyBridge.Application.Common;

namespace SkyBridge.Api.Extensions;

public static class ResultExtensions
{
    public static IActionResult ToActionResult<T>(this ControllerBase controller, Result<T> result, Func<T, IActionResult> onSuccess) =>
        result.Status switch
        {
            ResultStatus.Ok => onSuccess(result.Value!),
            ResultStatus.NotFound => controller.NotFound(),
            ResultStatus.Conflict => controller.Conflict(new ValidationProblemDetails(result.Errors) { Status = StatusCodes.Status409Conflict, Title = "Conflict" }),
            _ => controller.ValidationProblem(new ValidationProblemDetails(result.Errors))
        };
}