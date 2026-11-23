using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPirepsAndWallet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Balance",
                table: "Pilots",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Reward",
                table: "Bookings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "RewardPaidAtUtc",
                table: "Bookings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PilotTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PilotUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    BookingId = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PilotTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PilotTransactions_Pilots_PilotUserId",
                        column: x => x.PilotUserId,
                        principalTable: "Pilots",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Pireps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    PilotUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LegSequence = table.Column<int>(type: "int", nullable: false),
                    OriginAirportId = table.Column<int>(type: "int", nullable: false),
                    DestinationAirportId = table.Column<int>(type: "int", nullable: false),
                    AircraftTypeId = table.Column<int>(type: "int", nullable: false),
                    DistanceNm = table.Column<int>(type: "int", nullable: false),
                    DepartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ArrivedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FlightMinutes = table.Column<int>(type: "int", nullable: false),
                    FuelUsedKg = table.Column<int>(type: "int", nullable: true),
                    LandingRateFpm = table.Column<int>(type: "int", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    Flag = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ReviewNote = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    FiledAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pireps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pireps_AircraftTypes_AircraftTypeId",
                        column: x => x.AircraftTypeId,
                        principalTable: "AircraftTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pireps_Airports_DestinationAirportId",
                        column: x => x.DestinationAirportId,
                        principalTable: "Airports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pireps_Airports_OriginAirportId",
                        column: x => x.OriginAirportId,
                        principalTable: "Airports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pireps_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PilotTransactions_PilotUserId_CreatedAtUtc",
                table: "PilotTransactions",
                columns: new[] { "PilotUserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_AircraftTypeId",
                table: "Pireps",
                column: "AircraftTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_BookingId_LegSequence",
                table: "Pireps",
                columns: new[] { "BookingId", "LegSequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_DestinationAirportId",
                table: "Pireps",
                column: "DestinationAirportId");

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_OriginAirportId",
                table: "Pireps",
                column: "OriginAirportId");

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_PilotUserId_FiledAtUtc",
                table: "Pireps",
                columns: new[] { "PilotUserId", "FiledAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_Status",
                table: "Pireps",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PilotTransactions");

            migrationBuilder.DropTable(
                name: "Pireps");

            migrationBuilder.DropColumn(
                name: "Balance",
                table: "Pilots");

            migrationBuilder.DropColumn(
                name: "Reward",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RewardPaidAtUtc",
                table: "Bookings");
        }
    }
}
