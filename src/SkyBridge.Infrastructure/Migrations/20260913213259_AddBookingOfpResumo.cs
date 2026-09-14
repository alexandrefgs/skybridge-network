using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingOfpResumo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "OfpBlockFuelKg",
                table: "Bookings",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OfpDistanciaMn",
                table: "Bookings",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfpRotaTexto",
                table: "Bookings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OfpTripFuelKg",
                table: "Bookings",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OfpBlockFuelKg",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "OfpDistanciaMn",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "OfpRotaTexto",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "OfpTripFuelKg",
                table: "Bookings");
        }
    }
}
