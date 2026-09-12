using FluentValidation;
using SkyBridge.Application.DTOs;

namespace SkyBridge.Application.Validators;

public class RegistroPilotoDtoValidator : AbstractValidator<RegistroPilotoDto>
{
    public RegistroPilotoDtoValidator()
    {
        RuleFor(x => x.Nome).NotEmpty().MinimumLength(3).WithMessage("Nome deve ter pelo menos 3 caracteres.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("E-mail inválido.");
        RuleFor(x => x.Senha).NotEmpty().MinimumLength(8).WithMessage("Senha deve ter pelo menos 8 caracteres.");
    }
}