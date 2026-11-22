using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAirports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Airports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ident = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    IcaoCode = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: true),
                    IataCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Latitude = table.Column<double>(type: "float", nullable: false),
                    Longitude = table.Column<double>(type: "float", nullable: false),
                    ElevationFt = table.Column<int>(type: "int", nullable: true),
                    CountryCode = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    RegionCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Municipality = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ScheduledService = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Airports", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Airports_CountryCode",
                table: "Airports",
                column: "CountryCode");

            migrationBuilder.CreateIndex(
                name: "IX_Airports_IataCode",
                table: "Airports",
                column: "IataCode");

            migrationBuilder.CreateIndex(
                name: "IX_Airports_IcaoCode",
                table: "Airports",
                column: "IcaoCode");

            migrationBuilder.CreateIndex(
                name: "IX_Airports_Ident",
                table: "Airports",
                column: "Ident",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Airports");
        }
    }
}
