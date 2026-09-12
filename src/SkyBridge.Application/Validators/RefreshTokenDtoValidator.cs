using FluentValidation;
using SkyBridge.Application.DTOs;

namespace SkyBridge.Application.Validators;

public class RefreshTokenDtoValidator : AbstractValidator<RefreshTokenDto>
{
    public RefreshTokenDtoValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty().WithMessage("Refresh token é obrigatório.");
    }
}