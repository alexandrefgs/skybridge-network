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
            <= 200 => new ResultadoAvaliacaoPouso(LandingQuality.Suave, 1.05, +0.02),
            <= 600 => new ResultadoAvaliacaoPouso(LandingQuality.Moderado, 0.90, 0.0),
            <= 900 => new ResultadoAvaliacaoPouso(LandingQuality.Forte, 0.70, -0.10),
            _ => new ResultadoAvaliacaoPouso(LandingQuality.MuitoForte, 0.0, -0.30)
        };
    }
}