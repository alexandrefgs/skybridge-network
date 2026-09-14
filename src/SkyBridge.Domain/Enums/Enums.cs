namespace SkyBridge.Domain.Enums;

public enum OperationType
{
    Regional = 1,
    Nacional = 2,
    Internacional = 3,
    Executivo = 4,
    Cargueiro = 5
}

public enum LandingQuality
{
    Raso = 1,
    Perfeito = 2,
    Bom = 3,
    Firme = 4,
    EmAnalise = 5,
    Rejeitado = 6
}

public enum PirepStatus
{
    PendenteAprovacao = 1,
    Aprovado = 2,
    Rejeitado = 3
}

public enum PilotRole
{
    Piloto = 1,
    Admin = 2
}

public enum RedeOnline
{
    Nenhuma = 1,
    IVAO = 2,
    VATSIM = 3
}

public enum AwardOrigem
{
    Tour = 1,
    Patente = 2,
    Staff = 3
}