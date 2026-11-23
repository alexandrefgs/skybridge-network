using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRouteDetailsAndSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AtsRoute",
                table: "Routes",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FlightLevel",
                table: "Routes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "RoutesEdition",
                table: "Airlines",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RoutesSource",
                table: "Airlines",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RoutesUpdatedAtUtc",
                table: "Airlines",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RouteAircraft",
                columns: table => new
                {
                    RouteId = table.Column<int>(type: "int", nullable: false),
                    AircraftTypeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RouteAircraft", x => new { x.RouteId, x.AircraftTypeId });
                    table.ForeignKey(
                        name: "FK_RouteAircraft_AircraftTypes_AircraftTypeId",
                        column: x => x.AircraftTypeId,
                        principalTable: "AircraftTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RouteAircraft_Routes_RouteId",
                        column: x => x.RouteId,
                        principalTable: "Routes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RouteAircraft_AircraftTypeId",
                table: "RouteAircraft",
                column: "AircraftTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RouteAircraft");

            migrationBuilder.DropColumn(
                name: "AtsRoute",
                table: "Routes");

            migrationBuilder.DropColumn(
                name: "FlightLevel",
                table: "Routes");

            migrationBuilder.DropColumn(
                name: "RoutesEdition",
                table: "Airlines");

            migrationBuilder.DropColumn(
                name: "RoutesSource",
                table: "Airlines");

            migrationBuilder.DropColumn(
                name: "RoutesUpdatedAtUtc",
                table: "Airlines");
        }
    }
}
