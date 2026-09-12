using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PermitirExclusaoCascataRefreshToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefreshTokens_Pilots_PilotId",
                table: "RefreshTokens");

            migrationBuilder.AddForeignKey(
                name: "FK_RefreshTokens_Pilots_PilotId",
                table: "RefreshTokens",
                column: "PilotId",
                principalTable: "Pilots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefreshTokens_Pilots_PilotId",
                table: "RefreshTokens");

            migrationBuilder.AddForeignKey(
                name: "FK_RefreshTokens_Pilots_PilotId",
                table: "RefreshTokens",
                column: "PilotId",
                principalTable: "Pilots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
