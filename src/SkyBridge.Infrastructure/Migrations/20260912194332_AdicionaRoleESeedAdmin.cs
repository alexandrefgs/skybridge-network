using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaRoleESeedAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "Pilots",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.InsertData(
                table: "Pilots",
                columns: new[] { "Id", "Callsign", "Email", "Nome", "PasswordHash", "PontosTotais", "Rating", "Role" },
                values: new object[] { 1, "SKB0001", "admin@skybridge.com", "Administrador", "$2b$11$L7D1gaNSZ23hKlaQUMICV.wGRxXl0hna9iUESw9eiiRmtqDSTmni6", 0L, 5.0, 2 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Pilots",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Pilots");
        }
    }
}
