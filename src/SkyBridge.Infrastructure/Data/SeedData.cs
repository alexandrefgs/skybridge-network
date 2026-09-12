using Microsoft.EntityFrameworkCore;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Enums;

namespace SkyBridge.Infrastructure.Data;

public static class SeedData
{
    public static void Popular(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Airline>().HasData(
            new Airline { Id = 1, Nome = "LATAM Brasil", IATA = "JJ", ICAO = "TAM", Pais = "Brasil", CallsignPadrao = "LATAM" },
            new Airline { Id = 2, Nome = "GOL Linhas Aéreas", IATA = "G3", ICAO = "GLO", Pais = "Brasil", CallsignPadrao = "GOL" },
            new Airline { Id = 3, Nome = "Azul Linhas Aéreas", IATA = "AD", ICAO = "AZU", Pais = "Brasil", CallsignPadrao = "AZUL" },
            new Airline { Id = 4, Nome = "Delta Air Lines", IATA = "DL", ICAO = "DAL", Pais = "Estados Unidos", CallsignPadrao = "DELTA" },
            new Airline { Id = 5, Nome = "Lufthansa", IATA = "LH", ICAO = "DLH", Pais = "Alemanha", CallsignPadrao = "LUFTHANSA" },
            new Airline { Id = 6, Nome = "Emirates", IATA = "EK", ICAO = "UAE", Pais = "Emirados Árabes Unidos", CallsignPadrao = "EMIRATES" },
            new Airline { Id = 7, Nome = "FedEx Express", IATA = "FX", ICAO = "FDX", Pais = "Estados Unidos", CallsignPadrao = "FEDEX" },
            new Airline { Id = 8, Nome = "NetJets", IATA = "", ICAO = "EJA", Pais = "Estados Unidos", CallsignPadrao = "EXECJET" }
        );

        modelBuilder.Entity<Aircraft>().HasData(
            new Aircraft { Id = 1, Modelo = "Airbus A350-900", Matricula = "PR-XTB", AirlineId = 1, TiposOperacaoSuportados = new List<OperationType> { OperationType.Nacional, OperationType.Internacional } },
            new Aircraft { Id = 2, Modelo = "Boeing 737-800", Matricula = "PR-GOA", AirlineId = 2, TiposOperacaoSuportados = new List<OperationType> { OperationType.Nacional, OperationType.Regional } },
            new Aircraft { Id = 3, Modelo = "Embraer E195-E2", Matricula = "PR-YRH", AirlineId = 3, TiposOperacaoSuportados = new List<OperationType> { OperationType.Regional, OperationType.Nacional } },
            new Aircraft { Id = 4, Modelo = "Airbus A330-900", Matricula = "N401DX", AirlineId = 4, TiposOperacaoSuportados = new List<OperationType> { OperationType.Nacional, OperationType.Internacional } },
            new Aircraft { Id = 5, Modelo = "Boeing 747-8", Matricula = "D-ABYA", AirlineId = 5, TiposOperacaoSuportados = new List<OperationType> { OperationType.Internacional } },
            new Aircraft { Id = 6, Modelo = "Airbus A380-800", Matricula = "A6-EOA", AirlineId = 6, TiposOperacaoSuportados = new List<OperationType> { OperationType.Internacional } },
            new Aircraft { Id = 7, Modelo = "Boeing 777F", Matricula = "N850FD", AirlineId = 7, TiposOperacaoSuportados = new List<OperationType> { OperationType.Cargueiro } },
            new Aircraft { Id = 8, Modelo = "Cessna Citation X", Matricula = "N121QS", AirlineId = 8, TiposOperacaoSuportados = new List<OperationType> { OperationType.Executivo } }
        );

        modelBuilder.Entity<Rank>().HasData(
            new Rank { Id = 1, Nome = "FO Nacional", Nivel = 1, HorasMinimas = 0, RatingMinimo = 0, EscopoRota = OperationType.Nacional, AirlineId = 1 },
            new Rank { Id = 2, Nome = "Comandante Nacional", Nivel = 2, HorasMinimas = 100, RatingMinimo = 3.5, EscopoRota = OperationType.Nacional, AirlineId = 1 },
            new Rank { Id = 3, Nome = "FO Internacional", Nivel = 3, HorasMinimas = 250, RatingMinimo = 4.0, EscopoRota = OperationType.Internacional, AirlineId = 1 },
            new Rank { Id = 4, Nome = "Comandante Internacional", Nivel = 4, HorasMinimas = 500, RatingMinimo = 4.5, EscopoRota = OperationType.Internacional, AirlineId = 1 },
            new Rank { Id = 5, Nome = "Instrutor", Nivel = 5, HorasMinimas = 1000, RatingMinimo = 4.8, EscopoRota = OperationType.Internacional, AirlineId = 1 }
        );

        modelBuilder.Entity<FlightRoute>().HasData(
            new FlightRoute { Id = 1, AirlineId = 1, AeroportoOrigem = "SBGR", AeroportoDestino = "SBSP", DistanciaMilhas = 20, NumeroVoo = "3344", TipoOperacao = OperationType.Nacional, RatingMinimo = 0 },
            new FlightRoute { Id = 2, AirlineId = 1, AeroportoOrigem = "SBGR", AeroportoDestino = "KMIA", DistanciaMilhas = 3300, NumeroVoo = "8090", TipoOperacao = OperationType.Internacional, RatingMinimo = 3.5 },
            new FlightRoute { Id = 3, AirlineId = 2, AeroportoOrigem = "SBGR", AeroportoDestino = "SBGL", DistanciaMilhas = 220, NumeroVoo = "1234", TipoOperacao = OperationType.Nacional, RatingMinimo = 0 },
            new FlightRoute { Id = 4, AirlineId = 2, AeroportoOrigem = "SBSP", AeroportoDestino = "SBCT", DistanciaMilhas = 210, NumeroVoo = "1500", TipoOperacao = OperationType.Regional, RatingMinimo = 0 },
            new FlightRoute { Id = 5, AirlineId = 3, AeroportoOrigem = "SBKP", AeroportoDestino = "SBRF", DistanciaMilhas = 1500, NumeroVoo = "4000", TipoOperacao = OperationType.Nacional, RatingMinimo = 0 },
            new FlightRoute { Id = 6, AirlineId = 3, AeroportoOrigem = "SBSP", AeroportoDestino = "SBUL", DistanciaMilhas = 320, NumeroVoo = "4500", TipoOperacao = OperationType.Regional, RatingMinimo = 0 },
            new FlightRoute { Id = 7, AirlineId = 4, AeroportoOrigem = "KJFK", AeroportoDestino = "KLAX", DistanciaMilhas = 2475, NumeroVoo = "401", TipoOperacao = OperationType.Nacional, RatingMinimo = 0 },
            new FlightRoute { Id = 8, AirlineId = 4, AeroportoOrigem = "KJFK", AeroportoDestino = "LFPG", DistanciaMilhas = 3635, NumeroVoo = "8620", TipoOperacao = OperationType.Internacional, RatingMinimo = 3.0 },
            new FlightRoute { Id = 9, AirlineId = 5, AeroportoOrigem = "EDDF", AeroportoDestino = "KJFK", DistanciaMilhas = 3851, NumeroVoo = "400", TipoOperacao = OperationType.Internacional, RatingMinimo = 3.5 },
            new FlightRoute { Id = 10, AirlineId = 6, AeroportoOrigem = "OMDB", AeroportoDestino = "KJFK", DistanciaMilhas = 6838, NumeroVoo = "202", TipoOperacao = OperationType.Internacional, RatingMinimo = 4.0 },
            new FlightRoute { Id = 11, AirlineId = 7, AeroportoOrigem = "KMEM", AeroportoDestino = "LFPG", DistanciaMilhas = 4802, NumeroVoo = "23", TipoOperacao = OperationType.Cargueiro, RatingMinimo = 0 },
            new FlightRoute { Id = 12, AirlineId = 8, AeroportoOrigem = "KTEB", AeroportoDestino = "KMIA", DistanciaMilhas = 1090, NumeroVoo = "1", TipoOperacao = OperationType.Executivo, RatingMinimo = 0 }
        );
    }
}