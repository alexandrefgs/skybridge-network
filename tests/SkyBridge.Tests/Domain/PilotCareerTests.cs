using FluentAssertions;
using SkyBridge.Domain.Entities;
using Xunit;

namespace SkyBridge.Tests.Domain;

public class PilotCareerTests
{
    [Fact]
    public void RegistrarHoras_deve_acumular_horas_voadas()
    {
        var carreira = new PilotCareer { HorasVoadas = 10 };

        carreira.RegistrarHoras(2.5);

        carreira.HorasVoadas.Should().Be(12.5);
    }
}