using SkyBridge.Domain.Enums;

namespace SkyBridge.Domain.Services;

public record ResultadoAvaliacaoPouso(
    LandingQuality Qualidade,
    double MultiplicadorPontos,
    double ImpactoNoRating);

public interface ILandingEvaluator
{
    ResultadoAvaliacaoPouso Avaliar(int taxaDescidaTouchdownFpm);
}

public class LandingEvaluator : ILandingEvaluator
{
    public ResultadoAvaliacaoPouso Avaliar(int taxaDescidaTouchdownFpm)
    {
        var fpm = Math.Abs(taxaDescidaTouchdownFpm);

        return fpm switch
        {
            <= 100 => new ResultadoAvaliacaoPouso(LandingQuality.Raso, 1.0, -0.05),
            <= 150 => new ResultadoAvaliacaoPouso(LandingQuality.Perfeito, 1.05, +0.02),
            <= 200 => new ResultadoAvaliacaoPouso(LandingQuality.Bom, 0.95, -0.03),
            <= 300 => new ResultadoAvaliacaoPouso(LandingQuality.Firme, 0.80, -0.10),
            <= 500 => new ResultadoAvaliacaoPouso(LandingQuality.EmAnalise, 0.0, 0.0),
            _ => new ResultadoAvaliacaoPouso(LandingQuality.Rejeitado, 0.0, -0.30)
        };
    }
}