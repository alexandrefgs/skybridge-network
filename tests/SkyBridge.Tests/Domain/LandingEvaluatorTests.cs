using FluentAssertions;
using SkyBridge.Domain.Enums;
using SkyBridge.Domain.Services;
using Xunit;

namespace SkyBridge.Tests.Domain;

public class LandingEvaluatorTests
{
    private readonly ILandingEvaluator _evaluator = new LandingEvaluator();

    [Theory]
    [InlineData(-100, LandingQuality.Suave)]
    [InlineData(-200, LandingQuality.Suave)]
    [InlineData(-201, LandingQuality.Moderado)]
    [InlineData(-600, LandingQuality.Moderado)]
    [InlineData(-601, LandingQuality.Forte)]
    [InlineData(-900, LandingQuality.Forte)]
    [InlineData(-901, LandingQuality.MuitoForte)]
    [InlineData(-2000, LandingQuality.MuitoForte)]
    public void Deve_classificar_qualidade_do_pouso_pela_taxa_de_descida(int fpm, LandingQuality esperado)
    {
        var resultado = _evaluator.Avaliar(fpm);

        resultado.Qualidade.Should().Be(esperado);
    }

    [Fact]
    public void Pouso_suave_deve_dar_bonus_nos_pontos_e_no_rating()
    {
        var resultado = _evaluator.Avaliar(-150);

        resultado.MultiplicadorPontos.Should().BeGreaterThan(1.0);
        resultado.ImpactoNoRating.Should().BePositive();
    }

    [Fact]
    public void Pouso_muito_forte_deve_zerar_pontos_e_penalizar_rating_fortemente()
    {
        var resultado = _evaluator.Avaliar(-1500);

        resultado.MultiplicadorPontos.Should().Be(0.0);
        resultado.ImpactoNoRating.Should().Be(-0.30);
    }

    [Fact]
    public void Deve_tratar_valor_positivo_de_fpm_da_mesma_forma_que_negativo()
    {
        var resultadoNegativo = _evaluator.Avaliar(-500);
        var resultadoPositivo = _evaluator.Avaliar(500);

        resultadoPositivo.Should().BeEquivalentTo(resultadoNegativo);
    }
}