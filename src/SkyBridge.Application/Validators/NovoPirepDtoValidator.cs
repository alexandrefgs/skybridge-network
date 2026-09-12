using FluentValidation;
using SkyBridge.Application.DTOs;

namespace SkyBridge.Application.Validators;

public class NovoPirepDtoValidator : AbstractValidator<NovoPirepDto>
{
    public NovoPirepDtoValidator()
    {
        RuleFor(x => x.FlightRouteId).GreaterThan(0).WithMessage("Rota inválida.");
        RuleFor(x => x.AircraftId).GreaterThan(0).WithMessage("Aeronave inválida.");
        RuleFor(x => x.HorasDeVoo).GreaterThan(0).WithMessage("Horas de voo devem ser maiores que zero.");
    }
}