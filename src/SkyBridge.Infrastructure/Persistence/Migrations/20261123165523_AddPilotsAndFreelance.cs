using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPilotsAndFreelance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FreelanceJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Kind = table.Column<byte>(type: "tinyint", nullable: false),
                    OriginAirportId = table.Column<int>(type: "int", nullable: false),
                    DestinationAirportId = table.Column<int>(type: "int", nullable: false),
                    DistanceNm = table.Column<int>(type: "int", nullable: false),
                    Client = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Briefing = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Reward = table.Column<int>(type: "int", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FreelanceJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FreelanceJobs_Airports_DestinationAirportId",
                        column: x => x.DestinationAirportId,
                        principalTable: "Airports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FreelanceJobs_Airports_OriginAirportId",
                        column: x => x.OriginAirportId,
                        principalTable: "Airports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Pilots",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CurrentAirportId = table.Column<int>(type: "int", nullable: true),
                    FlightMinutes = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pilots", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_Pilots_Airports_CurrentAirportId",
                        column: x => x.CurrentAirportId,
                        principalTable: "Airports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Pilots_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FreelanceJobAircraft",
                columns: table => new
                {
                    FreelanceJobId = table.Column<int>(type: "int", nullable: false),
                    AircraftTypeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FreelanceJobAircraft", x => new { x.FreelanceJobId, x.AircraftTypeId });
                    table.ForeignKey(
                        name: "FK_FreelanceJobAircraft_AircraftTypes_AircraftTypeId",
                        column: x => x.AircraftTypeId,
                        principalTable: "AircraftTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FreelanceJobAircraft_FreelanceJobs_FreelanceJobId",
                        column: x => x.FreelanceJobId,
                        principalTable: "FreelanceJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FreelanceJobLeg",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FreelanceJobId = table.Column<int>(type: "int", nullable: false),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    OriginAirportId = table.Column<int>(type: "int", nullable: false),
                    DestinationAirportId = table.Column<int>(type: "int", nullable: false),
                    DistanceNm = table.Column<int>(type: "int", nullable: false),
                    PassengerCount = table.Column<int>(type: "int", nullable: false),
                    PassengerNames = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CargoKg = table.Column<int>(type: "int", nullable: false),
                    DangerousGoods = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FreelanceJobLeg", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FreelanceJobLeg_Airports_DestinationAirportId",
                        column: x => x.DestinationAirportId,
                        principalTable: "Airports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FreelanceJobLeg_Airports_OriginAirportId",
                        column: x => x.OriginAirportId,
                        principalTable: "Airports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FreelanceJobLeg_FreelanceJobs_FreelanceJobId",
                        column: x => x.FreelanceJobId,
                        principalTable: "FreelanceJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FreelanceJobAircraft_AircraftTypeId",
                table: "FreelanceJobAircraft",
                column: "AircraftTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_FreelanceJobLeg_DestinationAirportId",
                table: "FreelanceJobLeg",
                column: "DestinationAirportId");

            migrationBuilder.CreateIndex(
                name: "IX_FreelanceJobLeg_FreelanceJobId_Sequence",
                table: "FreelanceJobLeg",
                columns: new[] { "FreelanceJobId", "Sequence" });

            migrationBuilder.CreateIndex(
                name: "IX_FreelanceJobLeg_OriginAirportId",
                table: "FreelanceJobLeg",
                column: "OriginAirportId");

            migrationBuilder.CreateIndex(
                name: "IX_FreelanceJobs_DestinationAirportId",
                table: "FreelanceJobs",
                column: "DestinationAirportId");

            migrationBuilder.CreateIndex(
                name: "IX_FreelanceJobs_ExpiresAtUtc",
                table: "FreelanceJobs",
                column: "ExpiresAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_FreelanceJobs_OriginAirportId",
                table: "FreelanceJobs",
                column: "OriginAirportId");

            migrationBuilder.CreateIndex(
                name: "IX_Pilots_CurrentAirportId",
                table: "Pilots",
                column: "CurrentAirportId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FreelanceJobAircraft");

            migrationBuilder.DropTable(
                name: "FreelanceJobLeg");

            migrationBuilder.DropTable(
                name: "Pilots");

            migrationBuilder.DropTable(
                name: "FreelanceJobs");
        }
    }
}
