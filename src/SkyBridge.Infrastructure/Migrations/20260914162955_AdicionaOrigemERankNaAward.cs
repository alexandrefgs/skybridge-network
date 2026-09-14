using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaOrigemERankNaAward : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Origem",
                table: "Awards",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RankId",
                table: "Awards",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Awards_RankId",
                table: "Awards",
                column: "RankId");

            migrationBuilder.AddForeignKey(
                name: "FK_Awards_Ranks_RankId",
                table: "Awards",
                column: "RankId",
                principalTable: "Ranks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Awards_Ranks_RankId",
                table: "Awards");

            migrationBuilder.DropIndex(
                name: "IX_Awards_RankId",
                table: "Awards");

            migrationBuilder.DropColumn(
                name: "Origem",
                table: "Awards");

            migrationBuilder.DropColumn(
                name: "RankId",
                table: "Awards");
        }
    }
}
