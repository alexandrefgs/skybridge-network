using FluentAssertions;
using SkyBridge.Domain.Entities;
using Xunit;

namespace SkyBridge.Tests.Domain;

public class PilotTests
{
    [Fact]
    public void AjustarRating_nao_deve_ultrapassar_5_estrelas()
    {
        var pilot = new Pilot { Rating = 4.9 };

        pilot.AjustarRating(1.0);

        pilot.Rating.Should().Be(5.0);
    }

    [Fact]
    public void AjustarRating_nao_deve_ficar_abaixo_de_0_estrelas()
    {
        var pilot = new Pilot { Rating = 0.1 };

        pilot.AjustarRating(-1.0);

        pilot.Rating.Should().Be(0.0);
    }

    [Fact]
    public void AjustarRating_deve_somar_impacto_dentro_do_intervalo_valido()
    {
        var pilot = new Pilot { Rating = 3.0 };

        pilot.AjustarRating(0.5);

        pilot.Rating.Should().Be(3.5);
    }

    [Fact]
    public void AdicionarPontos_deve_acumular_pontos_totais()
    {
        var pilot = new Pilot { PontosTotais = 100 };

        pilot.AdicionarPontos(50);

        pilot.PontosTotais.Should().Be(150);
    }
}