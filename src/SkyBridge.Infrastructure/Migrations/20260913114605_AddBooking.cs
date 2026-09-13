using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBooking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SimBriefUsername",
                table: "Pilots",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PilotId = table.Column<int>(type: "int", nullable: false),
                    FlightRouteId = table.Column<int>(type: "int", nullable: false),
                    AircraftId = table.Column<int>(type: "int", nullable: false),
                    Callsign = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    SimBriefPerfilId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Alternado1 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Alternado2 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Alternado3 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Alternado4 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DataVooUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HorarioPartidaUtc = table.Column<TimeOnly>(type: "time", nullable: false),
                    HorarioChegadaUtc = table.Column<TimeOnly>(type: "time", nullable: false),
                    PayloadPassageiros = table.Column<int>(type: "int", nullable: true),
                    PayloadCargaKg = table.Column<int>(type: "int", nullable: true),
                    SimBriefOfpId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CriadoEmUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bookings_Aircrafts_AircraftId",
                        column: x => x.AircraftId,
                        principalTable: "Aircrafts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_FlightRoutes_FlightRouteId",
                        column: x => x.FlightRouteId,
                        principalTable: "FlightRoutes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_Pilots_PilotId",
                        column: x => x.PilotId,
                        principalTable: "Pilots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Pilots",
                keyColumn: "Id",
                keyValue: 1,
                column: "SimBriefUsername",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_AircraftId",
                table: "Bookings",
                column: "AircraftId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_FlightRouteId",
                table: "Bookings",
                column: "FlightRouteId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_PilotId",
                table: "Bookings",
                column: "PilotId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Status",
                table: "Bookings",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropColumn(
                name: "SimBriefUsername",
                table: "Pilots");
        }
    }
}
