using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PilotUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Source = table.Column<byte>(type: "tinyint", nullable: false),
                    FreelanceJobId = table.Column<int>(type: "int", nullable: true),
                    AircraftTypeId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    LegCount = table.Column<int>(type: "int", nullable: false),
                    CurrentLeg = table.Column<int>(type: "int", nullable: false),
                    BookedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StartDeadlineUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LegStartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FinishedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bookings_AircraftTypes_AircraftTypeId",
                        column: x => x.AircraftTypeId,
                        principalTable: "AircraftTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_FreelanceJobs_FreelanceJobId",
                        column: x => x.FreelanceJobId,
                        principalTable: "FreelanceJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Bookings_Pilots_PilotUserId",
                        column: x => x.PilotUserId,
                        principalTable: "Pilots",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ActivePilot",
                table: "Bookings",
                column: "PilotUserId",
                unique: true,
                filter: "[Status] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_AircraftTypeId",
                table: "Bookings",
                column: "AircraftTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TakenFreelanceJob",
                table: "Bookings",
                column: "FreelanceJobId",
                unique: true,
                filter: "[FreelanceJobId] IS NOT NULL AND [Status] IN (1, 2)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bookings");
        }
    }
}
