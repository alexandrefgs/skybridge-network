using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaToursEAwards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AwardId",
                table: "Tours",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FotoCapaUrl",
                table: "Tours",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FotoUrl",
                table: "Tours",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Awards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImagemUrl = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Awards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PilotAwards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PilotId = table.Column<int>(type: "int", nullable: false),
                    AwardId = table.Column<int>(type: "int", nullable: false),
                    DataConquista = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PilotAwards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PilotAwards_Awards_AwardId",
                        column: x => x.AwardId,
                        principalTable: "Awards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PilotAwards_Pilots_PilotId",
                        column: x => x.PilotId,
                        principalTable: "Pilots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tours_AwardId",
                table: "Tours",
                column: "AwardId");

            migrationBuilder.CreateIndex(
                name: "IX_PilotAwards_AwardId",
                table: "PilotAwards",
                column: "AwardId");

            migrationBuilder.CreateIndex(
                name: "IX_PilotAwards_PilotId",
                table: "PilotAwards",
                column: "PilotId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_Awards_AwardId",
                table: "Tours",
                column: "AwardId",
                principalTable: "Awards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tours_Awards_AwardId",
                table: "Tours");

            migrationBuilder.DropTable(
                name: "PilotAwards");

            migrationBuilder.DropTable(
                name: "Awards");

            migrationBuilder.DropIndex(
                name: "IX_Tours_AwardId",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "AwardId",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "FotoCapaUrl",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "FotoUrl",
                table: "Tours");
        }
    }
}
