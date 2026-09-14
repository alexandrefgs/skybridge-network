using SkyBridge.Domain.Enums;

namespace SkyBridge.Domain.Entities;

public class Booking
{
    public int Id { get; set; }

    public int PilotId { get; set; }
    public Pilot? Pilot { get; set; }

    public int FlightRouteId { get; set; }
    public FlightRoute? FlightRoute { get; set; }

    public int AircraftId { get; set; }
    public Aircraft? Aircraft { get; set; }

    public string Callsign { get; set; } = string.Empty;
    public string? SimBriefPerfilId { get; set; }

    public string? Alternado1 { get; set; }
    public string? Alternado2 { get; set; }
    public string? Alternado3 { get; set; }
    public string? Alternado4 { get; set; }

    public DateTime DataVooUtc { get; set; }
    public TimeOnly HorarioPartidaUtc { get; set; }
    public TimeOnly HorarioChegadaUtc { get; set; }

    public int? PayloadPassageiros { get; set; }
    public int? PayloadCargaKg { get; set; }

    public string? SimBriefOfpId { get; set; }
    public double? OfpDistanciaMn { get; set; }
    public double? OfpBlockFuelKg { get; set; }
    public double? OfpTripFuelKg { get; set; }
    public string? OfpRotaTexto { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Rascunho;
    public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;

    public bool JaDecolou { get; set; }
    public DateTime? MomentoDecolagemUtc { get; set; }
    public DateTime? MomentoToqueUtc { get; set; }
    public int? TaxaDescidaTouchdownFpm { get; set; }
    public DateTime? ParadoDesdeUtc { get; set; }
    public bool ProntoParaPirep { get; set; }
    public DateTime? UltimaTelemetriaUtc { get; set; }

    public void DefinirCallsign(string callsign, string prefixoCompanhia)
    {
        var callsignNormalizado = callsign.Trim().ToUpperInvariant();
        var prefixoNormalizado = prefixoCompanhia.Trim().ToUpperInvariant();

        if (!callsignNormalizado.StartsWith(prefixoNormalizado))
        {
            throw new InvalidOperationException(
                $"O callsign \"{callsign}\" precisa começar com o prefixo \"{prefixoCompanhia}\" da companhia.");
        }

        Callsign = callsignNormalizado;
    }

    public void DefinirAlternados(string? a1, string? a2, string? a3, string? a4)
    {
        Alternado1 = a1;
        Alternado2 = a2;
        Alternado3 = a3;
        Alternado4 = a4;
    }

    public void MarcarBriefingGerado(string simBriefOfpId)
    {
        SimBriefOfpId = simBriefOfpId;
        Status = BookingStatus.BriefingGerado;
    }

    public void IniciarVoo()
    {
        Status = BookingStatus.EmVoo;
        JaDecolou = false;
        MomentoDecolagemUtc = null;
        MomentoToqueUtc = null;
        TaxaDescidaTouchdownFpm = null;
        ParadoDesdeUtc = null;
        ProntoParaPirep = false;
        UltimaTelemetriaUtc = DateTime.UtcNow;
    }

    public void RegistrarTelemetria(bool estaNoSolo, double velocidadeNos, double velocidadeVerticalFpm, DateTime agoraUtc, TimeSpan tempoParadoNecessario)
    {
        UltimaTelemetriaUtc = agoraUtc;

        if (!JaDecolou)
        {
            if (!estaNoSolo)
            {
                JaDecolou = true;
                MomentoDecolagemUtc = agoraUtc;
            }
            return;
        }

        if (MomentoToqueUtc is null)
        {
            if (estaNoSolo)
            {
                MomentoToqueUtc = agoraUtc;
                TaxaDescidaTouchdownFpm = (int)Math.Round(velocidadeVerticalFpm);
            }
            return;
        }

        if (ProntoParaPirep) return;

        if (estaNoSolo && velocidadeNos < 2)
        {
            ParadoDesdeUtc ??= agoraUtc;
            if (agoraUtc - ParadoDesdeUtc.Value >= tempoParadoNecessario)
                ProntoParaPirep = true;
        }
        else
        {
            ParadoDesdeUtc = null;
        }
    }

    public bool DeveExpirar(DateTime agoraUtc, TimeSpan validade) =>
    Status != BookingStatus.Concluido && Status != BookingStatus.Cancelado && (agoraUtc - CriadoEmUtc) > validade;

    public double? CalcularHorasDeVoo() =>
        MomentoDecolagemUtc.HasValue && MomentoToqueUtc.HasValue
            ? (MomentoToqueUtc.Value - MomentoDecolagemUtc.Value).TotalHours
            : null;

    public void MarcarConcluido() => Status = BookingStatus.Concluido;

    public void Cancelar() => Status = BookingStatus.Cancelado;
    public ICollection<TelemetriaLog> LogsDeTelemetria { get; set; } = new List<TelemetriaLog>();
}