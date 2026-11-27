using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPilotNetworkIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IvaoId",
                table: "Pilots",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VatsimId",
                table: "Pilots",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IvaoId",
                table: "Pilots");

            migrationBuilder.DropColumn(
                name: "VatsimId",
                table: "Pilots");
        }
    }
}
