using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Airlines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IATA = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ICAO = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Pais = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CallsignPadrao = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Airlines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pilots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Callsign = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rating = table.Column<double>(type: "float", nullable: false),
                    PontosTotais = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pilots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tours",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PontosBonusConclusao = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tours", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Aircrafts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Modelo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Matricula = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AirlineId = table.Column<int>(type: "int", nullable: false),
                    TiposOperacaoSuportados = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Aircrafts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Aircrafts_Airlines_AirlineId",
                        column: x => x.AirlineId,
                        principalTable: "Airlines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FlightRoutes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AeroportoOrigem = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AeroportoDestino = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DistanciaMilhas = table.Column<int>(type: "int", nullable: false),
                    NumeroVoo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoOperacao = table.Column<int>(type: "int", nullable: false),
                    RatingMinimo = table.Column<double>(type: "float", nullable: false),
                    RankMinimoId = table.Column<int>(type: "int", nullable: true),
                    AirlineId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightRoutes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlightRoutes_Airlines_AirlineId",
                        column: x => x.AirlineId,
                        principalTable: "Airlines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Ranks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nivel = table.Column<int>(type: "int", nullable: false),
                    HorasMinimas = table.Column<int>(type: "int", nullable: false),
                    RatingMinimo = table.Column<double>(type: "float", nullable: false),
                    EscopoRota = table.Column<int>(type: "int", nullable: false),
                    AirlineId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ranks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ranks_Airlines_AirlineId",
                        column: x => x.AirlineId,
                        principalTable: "Airlines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PilotId = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevogadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Pilots_PilotId",
                        column: x => x.PilotId,
                        principalTable: "Pilots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TourProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PilotId = table.Column<int>(type: "int", nullable: false),
                    TourId = table.Column<int>(type: "int", nullable: false),
                    EtapasCompletas = table.Column<int>(type: "int", nullable: false),
                    Concluido = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourProgresses_Pilots_PilotId",
                        column: x => x.PilotId,
                        principalTable: "Pilots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourProgresses_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Pireps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PilotId = table.Column<int>(type: "int", nullable: false),
                    FlightRouteId = table.Column<int>(type: "int", nullable: false),
                    AircraftId = table.Column<int>(type: "int", nullable: false),
                    DataVoo = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HorasDeVoo = table.Column<double>(type: "float", nullable: false),
                    TaxaDescidaTouchdownFpm = table.Column<int>(type: "int", nullable: false),
                    QualidadePouso = table.Column<int>(type: "int", nullable: false),
                    PontosGanhos = table.Column<long>(type: "bigint", nullable: false),
                    ImpactoNoRating = table.Column<double>(type: "float", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Observacoes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pireps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pireps_Aircrafts_AircraftId",
                        column: x => x.AircraftId,
                        principalTable: "Aircrafts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pireps_FlightRoutes_FlightRouteId",
                        column: x => x.FlightRouteId,
                        principalTable: "FlightRoutes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pireps_Pilots_PilotId",
                        column: x => x.PilotId,
                        principalTable: "Pilots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TourStops",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TourId = table.Column<int>(type: "int", nullable: false),
                    FlightRouteId = table.Column<int>(type: "int", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourStops", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourStops_FlightRoutes_FlightRouteId",
                        column: x => x.FlightRouteId,
                        principalTable: "FlightRoutes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourStops_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PilotCareers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PilotId = table.Column<int>(type: "int", nullable: false),
                    AirlineId = table.Column<int>(type: "int", nullable: false),
                    HorasVoadas = table.Column<double>(type: "float", nullable: false),
                    RankAtualId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PilotCareers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PilotCareers_Airlines_AirlineId",
                        column: x => x.AirlineId,
                        principalTable: "Airlines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PilotCareers_Pilots_PilotId",
                        column: x => x.PilotId,
                        principalTable: "Pilots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PilotCareers_Ranks_RankAtualId",
                        column: x => x.RankAtualId,
                        principalTable: "Ranks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Airlines",
                columns: new[] { "Id", "CallsignPadrao", "IATA", "ICAO", "Nome", "Pais" },
                values: new object[,]
                {
                    { 1, "LATAM", "JJ", "TAM", "LATAM Brasil", "Brasil" },
                    { 2, "GOL", "G3", "GLO", "GOL Linhas Aéreas", "Brasil" },
                    { 3, "AZUL", "AD", "AZU", "Azul Linhas Aéreas", "Brasil" },
                    { 4, "DELTA", "DL", "DAL", "Delta Air Lines", "Estados Unidos" },
                    { 5, "LUFTHANSA", "LH", "DLH", "Lufthansa", "Alemanha" },
                    { 6, "EMIRATES", "EK", "UAE", "Emirates", "Emirados Árabes Unidos" },
                    { 7, "FEDEX", "FX", "FDX", "FedEx Express", "Estados Unidos" },
                    { 8, "EXECJET", "", "EJA", "NetJets", "Estados Unidos" }
                });

            migrationBuilder.InsertData(
                table: "Aircrafts",
                columns: new[] { "Id", "AirlineId", "Matricula", "Modelo", "TiposOperacaoSuportados" },
                values: new object[,]
                {
                    { 1, 1, "PR-XTB", "Airbus A350-900", "Nacional,Internacional" },
                    { 2, 2, "PR-GOA", "Boeing 737-800", "Nacional,Regional" },
                    { 3, 3, "PR-YRH", "Embraer E195-E2", "Regional,Nacional" },
                    { 4, 4, "N401DX", "Airbus A330-900", "Nacional,Internacional" },
                    { 5, 5, "D-ABYA", "Boeing 747-8", "Internacional" },
                    { 6, 6, "A6-EOA", "Airbus A380-800", "Internacional" },
                    { 7, 7, "N850FD", "Boeing 777F", "Cargueiro" },
                    { 8, 8, "N121QS", "Cessna Citation X", "Executivo" }
                });

            migrationBuilder.InsertData(
                table: "FlightRoutes",
                columns: new[] { "Id", "AeroportoDestino", "AeroportoOrigem", "AirlineId", "DistanciaMilhas", "NumeroVoo", "RankMinimoId", "RatingMinimo", "TipoOperacao" },
                values: new object[,]
                {
                    { 1, "SBSP", "SBGR", 1, 20, "3344", null, 0.0, 2 },
                    { 2, "KMIA", "SBGR", 1, 3300, "8090", null, 3.5, 3 },
                    { 3, "SBGL", "SBGR", 2, 220, "1234", null, 0.0, 2 },
                    { 4, "SBCT", "SBSP", 2, 210, "1500", null, 0.0, 1 },
                    { 5, "SBRF", "SBKP", 3, 1500, "4000", null, 0.0, 2 },
                    { 6, "SBUL", "SBSP", 3, 320, "4500", null, 0.0, 1 },
                    { 7, "KLAX", "KJFK", 4, 2475, "401", null, 0.0, 2 },
                    { 8, "LFPG", "KJFK", 4, 3635, "8620", null, 3.0, 3 },
                    { 9, "KJFK", "EDDF", 5, 3851, "400", null, 3.5, 3 },
                    { 10, "KJFK", "OMDB", 6, 6838, "202", null, 4.0, 3 },
                    { 11, "LFPG", "KMEM", 7, 4802, "23", null, 0.0, 5 },
                    { 12, "KMIA", "KTEB", 8, 1090, "1", null, 0.0, 4 }
                });

            migrationBuilder.InsertData(
                table: "Ranks",
                columns: new[] { "Id", "AirlineId", "EscopoRota", "HorasMinimas", "Nivel", "Nome", "RatingMinimo" },
                values: new object[,]
                {
                    { 1, 1, 2, 0, 1, "FO Nacional", 0.0 },
                    { 2, 1, 2, 100, 2, "Comandante Nacional", 3.5 },
                    { 3, 1, 3, 250, 3, "FO Internacional", 4.0 },
                    { 4, 1, 3, 500, 4, "Comandante Internacional", 4.5 },
                    { 5, 1, 3, 1000, 5, "Instrutor", 4.7999999999999998 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Aircrafts_AirlineId",
                table: "Aircrafts",
                column: "AirlineId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightRoutes_AirlineId",
                table: "FlightRoutes",
                column: "AirlineId");

            migrationBuilder.CreateIndex(
                name: "IX_PilotCareers_AirlineId",
                table: "PilotCareers",
                column: "AirlineId");

            migrationBuilder.CreateIndex(
                name: "IX_PilotCareers_PilotId",
                table: "PilotCareers",
                column: "PilotId");

            migrationBuilder.CreateIndex(
                name: "IX_PilotCareers_RankAtualId",
                table: "PilotCareers",
                column: "RankAtualId");

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_AircraftId",
                table: "Pireps",
                column: "AircraftId");

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_FlightRouteId",
                table: "Pireps",
                column: "FlightRouteId");

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_PilotId",
                table: "Pireps",
                column: "PilotId");

            migrationBuilder.CreateIndex(
                name: "IX_Ranks_AirlineId",
                table: "Ranks",
                column: "AirlineId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_PilotId",
                table: "RefreshTokens",
                column: "PilotId");

            migrationBuilder.CreateIndex(
                name: "IX_TourProgresses_PilotId",
                table: "TourProgresses",
                column: "PilotId");

            migrationBuilder.CreateIndex(
                name: "IX_TourProgresses_TourId",
                table: "TourProgresses",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_TourStops_FlightRouteId",
                table: "TourStops",
                column: "FlightRouteId");

            migrationBuilder.CreateIndex(
                name: "IX_TourStops_TourId",
                table: "TourStops",
                column: "TourId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PilotCareers");

            migrationBuilder.DropTable(
                name: "Pireps");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "TourProgresses");

            migrationBuilder.DropTable(
                name: "TourStops");

            migrationBuilder.DropTable(
                name: "Ranks");

            migrationBuilder.DropTable(
                name: "Aircrafts");

            migrationBuilder.DropTable(
                name: "Pilots");

            migrationBuilder.DropTable(
                name: "FlightRoutes");

            migrationBuilder.DropTable(
                name: "Tours");

            migrationBuilder.DropTable(
                name: "Airlines");
        }
    }
}
