using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSimBriefFlightPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SimBriefPilotId",
                table: "Pilots",
                type: "nvarchar(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FlightPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    LegSequence = table.Column<int>(type: "int", nullable: false),
                    SimBriefId = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    GeneratedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ImportedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Airac = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Origin = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    Destination = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    Alternate = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: true),
                    Aircraft = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    Registration = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: true),
                    Callsign = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: true),
                    Route = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CruiseAltitudeFt = table.Column<int>(type: "int", nullable: false),
                    DistanceNm = table.Column<int>(type: "int", nullable: false),
                    EnrouteMinutes = table.Column<int>(type: "int", nullable: false),
                    BlockFuelKg = table.Column<int>(type: "int", nullable: false),
                    TakeoffFuelKg = table.Column<int>(type: "int", nullable: false),
                    LandingFuelKg = table.Column<int>(type: "int", nullable: false),
                    TripFuelKg = table.Column<int>(type: "int", nullable: false),
                    PassengerCount = table.Column<int>(type: "int", nullable: false),
                    CargoKg = table.Column<int>(type: "int", nullable: false),
                    ZeroFuelWeightKg = table.Column<int>(type: "int", nullable: false),
                    TakeoffWeightKg = table.Column<int>(type: "int", nullable: false),
                    LandingWeightKg = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlightPlans_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FlightPlans_BookingId_LegSequence",
                table: "FlightPlans",
                columns: new[] { "BookingId", "LegSequence" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FlightPlans");

            migrationBuilder.DropColumn(
                name: "SimBriefPilotId",
                table: "Pilots");
        }
    }
}
