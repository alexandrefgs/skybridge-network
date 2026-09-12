using FluentValidation;
using SkyBridge.Application.DTOs;

namespace SkyBridge.Application.Validators;

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("E-mail inválido.");
        RuleFor(x => x.Senha).NotEmpty().WithMessage("Senha é obrigatória.");
    }
}