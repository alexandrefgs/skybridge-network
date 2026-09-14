using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SincronizaModeloPendente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TelemetriaLog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    Latitude = table.Column<double>(type: "float", nullable: false),
                    Longitude = table.Column<double>(type: "float", nullable: false),
                    AltitudePes = table.Column<double>(type: "float", nullable: false),
                    VelocidadeNos = table.Column<double>(type: "float", nullable: false),
                    Heading = table.Column<double>(type: "float", nullable: false),
                    EstaNoSolo = table.Column<bool>(type: "bit", nullable: false),
                    VelocidadeVerticalFpm = table.Column<double>(type: "float", nullable: false),
                    RegistradoEmUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelemetriaLog", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelemetriaLog_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TelemetriaLog_BookingId",
                table: "TelemetriaLog",
                column: "BookingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TelemetriaLog");
        }
    }
}
