using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingFlightTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "JaDecolou",
                table: "Bookings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "MomentoDecolagemUtc",
                table: "Bookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "MomentoToqueUtc",
                table: "Bookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ParadoDesdeUtc",
                table: "Bookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ProntoParaPirep",
                table: "Bookings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TaxaDescidaTouchdownFpm",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UltimaTelemetriaUtc",
                table: "Bookings",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JaDecolou",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "MomentoDecolagemUtc",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "MomentoToqueUtc",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ParadoDesdeUtc",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ProntoParaPirep",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "TaxaDescidaTouchdownFpm",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "UltimaTelemetriaUtc",
                table: "Bookings");
        }
    }
}
