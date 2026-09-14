using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAutopilotDeTelemetriaLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutopilotLigado",
                table: "TelemetriaLog");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AutopilotLigado",
                table: "TelemetriaLog",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
