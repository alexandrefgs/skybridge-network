namespace SkyBridge.Application.DTOs;

public record NovoBookingDto(
    int FlightRouteId,
    int AircraftId,
    string Callsign,
    DateOnly DataVoo,
    int HoraPartidaUtc,
    int MinutoPartidaUtc,
    int HoraChegadaUtc,
    int MinutoChegadaUtc
);

public record AlternadosDto(string? Alternado1, string? Alternado2, string? Alternado3, string? Alternado4);

public record PerfilSimBriefDto(string SimBriefPerfilId);

public record PayloadDto(int? PayloadPassageiros, int? PayloadCargaKg);

public record BookingDto(
    int Id,
    string Callsign,
    string AeroportoOrigem,
    string AeroportoDestino,
    string NumeroVoo,
    string AeronaveModelo,
    string AeronaveCodigoIcao,
    string Matricula,
    string Status,
    DateTime DataVooUtc,
    string? SimBriefPerfilId,
    string? SimBriefOfpId,
    string? Alternado1,
    string? Alternado2,
    string? Alternado3,
    string? Alternado4,
    int? PayloadPassageiros,
    int? PayloadCargaKg,
    double? OfpDistanciaMn,
    double? OfpBlockFuelKg,
    double? OfpTripFuelKg,
    string? OfpRotaTexto
);

public record SimBriefRedirectDto(string Url);

public record StatusVooDto(string Status, bool ProntoParaPirep, double? HorasDeVoo, int? TaxaDescidaTouchdownFpm);