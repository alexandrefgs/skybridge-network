namespace SkyBridge.UnitTests.Airlines;

public static class RplSample
{
    public static string Header(string airline) => $"""


                                                       Planos de Voo Repetitivos
                                                       Classificação: Ident Anv

        CIA: {airline}                                    INÍCIO DE VALIDADE: 19nov.2026                                       PAG.: 1
        -----------------------------------------------------------------------------------------------------------------------------------------
           VALIDO VALIDO DIAS OP  IDENT  TIPO   ADEP     VEL   FL  ROTA                                DEST         OBSERVACOES
           DESDE   ATE   STQQSSD   ANV     TURB     EOBT                                                   EET
        -----------------------------------------------------------------------------------------------------------------------------------------

        """;

    public static string Flight(string ident, string type, string origin, string destination, int level, string route) =>
        $"   191126 251126 1234500 {ident,-7} {type}/M {origin}0910 N0450 {level:000} {route,-36}{destination}0043 EQPT/SDFGIKRWY/LB1\r\n" +
        $"{new string(' ', 104)}PBN/B1C1D1O1S2T1 EET/SBCW0003\r\n";

    public static string Continuation(string route) => $"{new string(' ', 59)}{route,-45}PBN/B1C1D1O1S2\r\n";
}