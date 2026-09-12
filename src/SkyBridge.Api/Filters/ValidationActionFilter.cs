using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SkyBridge.Api.Filters;

public class ValidationActionFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _serviceProvider;
    public ValidationActionFilter(IServiceProvider serviceProvider) => _serviceProvider = serviceProvider;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var argumento in context.ActionArguments.Values)
        {
            if (argumento is null) continue;

            var tipoValidador = typeof(IValidator<>).MakeGenericType(argumento.GetType());
            if (_serviceProvider.GetService(tipoValidador) is not IValidator validador) continue;

            var contexto = new ValidationContext<object>(argumento);
            var resultado = await validador.ValidateAsync(contexto);

            if (!resultado.IsValid)
            {
                context.Result = new BadRequestObjectResult(new
                {
                    erros = resultado.Errors.Select(e => e.ErrorMessage)
                });
                return;
            }
        }

        await next();
    }
}