using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAirlineBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AirlineName",
                table: "Bookings",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DestinationAirportId",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DistanceNm",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FlightNumber",
                table: "Bookings",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OriginAirportId",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PayPerHour",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RouteId",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PayPerHour",
                table: "AircraftCategories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "AircraftCategories",
                keyColumn: "Code",
                keyValue: 1,
                column: "PayPerHour",
                value: 60);

            migrationBuilder.UpdateData(
                table: "AircraftCategories",
                keyColumn: "Code",
                keyValue: 2,
                column: "PayPerHour",
                value: 90);

            migrationBuilder.UpdateData(
                table: "AircraftCategories",
                keyColumn: "Code",
                keyValue: 3,
                column: "PayPerHour",
                value: 130);

            migrationBuilder.UpdateData(
                table: "AircraftCategories",
                keyColumn: "Code",
                keyValue: 4,
                column: "PayPerHour",
                value: 180);

            migrationBuilder.UpdateData(
                table: "AircraftCategories",
                keyColumn: "Code",
                keyValue: 5,
                column: "PayPerHour",
                value: 170);

            migrationBuilder.UpdateData(
                table: "AircraftCategories",
                keyColumn: "Code",
                keyValue: 6,
                column: "PayPerHour",
                value: 220);

            migrationBuilder.UpdateData(
                table: "AircraftCategories",
                keyColumn: "Code",
                keyValue: 7,
                column: "PayPerHour",
                value: 280);

            migrationBuilder.UpdateData(
                table: "AircraftCategories",
                keyColumn: "Code",
                keyValue: 8,
                column: "PayPerHour",
                value: 320);

            migrationBuilder.UpdateData(
                table: "AircraftCategories",
                keyColumn: "Code",
                keyValue: 9,
                column: "PayPerHour",
                value: 450);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_DestinationAirportId",
                table: "Bookings",
                column: "DestinationAirportId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_OriginAirportId",
                table: "Bookings",
                column: "OriginAirportId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_RouteId",
                table: "Bookings",
                column: "RouteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Airports_DestinationAirportId",
                table: "Bookings",
                column: "DestinationAirportId",
                principalTable: "Airports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Airports_OriginAirportId",
                table: "Bookings",
                column: "OriginAirportId",
                principalTable: "Airports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Routes_RouteId",
                table: "Bookings",
                column: "RouteId",
                principalTable: "Routes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Airports_DestinationAirportId",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Airports_OriginAirportId",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Routes_RouteId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_DestinationAirportId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_OriginAirportId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_RouteId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "AirlineName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DestinationAirportId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DistanceNm",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "FlightNumber",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "OriginAirportId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PayPerHour",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RouteId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PayPerHour",
                table: "AircraftCategories");
        }
    }
}
