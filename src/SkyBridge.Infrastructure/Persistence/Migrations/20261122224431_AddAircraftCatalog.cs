using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAircraftCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AircraftCategories",
                columns: table => new
                {
                    Code = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RequiredHours = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AircraftCategories", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "AircraftTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IcaoCode = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: false),
                    Manufacturer = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Model = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Category = table.Column<int>(type: "int", nullable: false),
                    EngineType = table.Column<int>(type: "int", nullable: false),
                    EngineCount = table.Column<int>(type: "int", nullable: false),
                    RangeNm = table.Column<int>(type: "int", nullable: false),
                    CruiseSpeedKts = table.Column<int>(type: "int", nullable: false),
                    Seats = table.Column<int>(type: "int", nullable: false),
                    MaxCargoKg = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AircraftTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AircraftTypes_AircraftCategories_Category",
                        column: x => x.Category,
                        principalTable: "AircraftCategories",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "AircraftCategories",
                columns: new[] { "Code", "Name", "RequiredHours" },
                values: new object[,]
                {
                    { 1, "Single piston", 0 },
                    { 2, "Twin piston", 0 },
                    { 3, "Turboprop", 25 },
                    { 4, "Regional", 75 },
                    { 5, "Light jet", 75 },
                    { 6, "Mid-size jet", 150 },
                    { 7, "Large business jet", 300 },
                    { 8, "Medium (narrow-body)", 300 },
                    { 9, "Heavy (wide-body)", 600 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AircraftTypes_Category",
                table: "AircraftTypes",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_AircraftTypes_IcaoCode",
                table: "AircraftTypes",
                column: "IcaoCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AircraftTypes");

            migrationBuilder.DropTable(
                name: "AircraftCategories");
        }
    }
}
