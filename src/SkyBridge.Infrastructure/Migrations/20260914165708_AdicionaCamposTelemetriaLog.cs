using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaCamposTelemetriaLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AeronaveNome",
                table: "TelemetriaLog",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AutopilotLigado",
                table: "TelemetriaLog",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "Bank",
                table: "TelemetriaLog",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "FlapsPercentual",
                table: "TelemetriaLog",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "FrequenciaComAtiva",
                table: "TelemetriaLog",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Pitch",
                table: "TelemetriaLog",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<bool>(
                name: "SpoilersArmado",
                table: "TelemetriaLog",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "SpoilersPercentual",
                table: "TelemetriaLog",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "Squawk",
                table: "TelemetriaLog",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "TrainPousoPercentual",
                table: "TelemetriaLog",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AeronaveNome",
                table: "TelemetriaLog");

            migrationBuilder.DropColumn(
                name: "AutopilotLigado",
                table: "TelemetriaLog");

            migrationBuilder.DropColumn(
                name: "Bank",
                table: "TelemetriaLog");

            migrationBuilder.DropColumn(
                name: "FlapsPercentual",
                table: "TelemetriaLog");

            migrationBuilder.DropColumn(
                name: "FrequenciaComAtiva",
                table: "TelemetriaLog");

            migrationBuilder.DropColumn(
                name: "Pitch",
                table: "TelemetriaLog");

            migrationBuilder.DropColumn(
                name: "SpoilersArmado",
                table: "TelemetriaLog");

            migrationBuilder.DropColumn(
                name: "SpoilersPercentual",
                table: "TelemetriaLog");

            migrationBuilder.DropColumn(
                name: "Squawk",
                table: "TelemetriaLog");

            migrationBuilder.DropColumn(
                name: "TrainPousoPercentual",
                table: "TelemetriaLog");
        }
    }
}
