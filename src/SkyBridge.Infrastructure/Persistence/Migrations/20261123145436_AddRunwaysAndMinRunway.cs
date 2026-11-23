using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRunwaysAndMinRunway : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LongestHardRunwayFt",
                table: "Airports",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LongestRunwayFt",
                table: "Airports",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinRunwayFt",
                table: "AircraftTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresPavedRunway",
                table: "AircraftTypes",
                type: "bit",
                nullable: false,
                defaultValue: false);
                        migrationBuilder.Sql("""
                UPDATE t SET t.MinRunwayFt = v.MinRunway, t.RequiresPavedRunway = v.Paved
                FROM AircraftTypes t
                JOIN (VALUES
                    ('C152', 1500, 0), ('C172', 1700, 0), ('P28A', 2000, 0), ('SR22', 2500, 0), ('DA40', 2000, 0),
                    ('DA62', 2400, 0), ('BE58', 2700, 0), ('PA34', 2700, 0),
                    ('C208', 2300, 0), ('KODI', 1500, 0), ('TBM9', 2600, 0), ('PC12', 2500, 0), ('B350', 3300, 0),
                    ('AT76', 3000, 0), ('DH8D', 3500, 1), ('E175', 4000, 1), ('E190', 4000, 1), ('E195', 4000, 1), ('CRJ9', 4500, 1),
                    ('E50P', 3000, 1), ('E55P', 3200, 1), ('HDJT', 3500, 1), ('C25C', 3300, 1),
                    ('C68A', 3600, 1), ('C700', 4000, 1), ('CL35', 4800, 1), ('LJ75', 4500, 1),
                    ('GLF6', 6000, 1), ('GL7T', 5800, 1), ('FA7X', 5500, 1),
                    ('A319', 4300, 1), ('A320', 4300, 1), ('A20N', 4300, 1), ('A21N', 4300, 1),
                    ('B737', 4300, 1), ('B738', 4300, 1), ('B38M', 4300, 1), ('B739', 4500, 1),
                    ('A332', 6500, 1), ('A339', 6600, 1), ('A359', 6500, 1), ('A388', 9000, 1),
                    ('B772', 7000, 1), ('B77W', 8500, 1), ('B788', 6500, 1), ('B789', 7000, 1), ('B748', 9000, 1)
                ) AS v(IcaoCode, MinRunway, Paved) ON t.IcaoCode = v.IcaoCode;

                UPDATE AircraftTypes SET
                    MinRunwayFt = CASE Category WHEN 1 THEN 2000 WHEN 2 THEN 2700 WHEN 3 THEN 3000 WHEN 4 THEN 4000
                        WHEN 5 THEN 3500 WHEN 6 THEN 4500 WHEN 7 THEN 6000 WHEN 8 THEN 4500 ELSE 7500 END,
                    RequiresPavedRunway = CASE WHEN Category >= 4 THEN 1 ELSE 0 END
                WHERE MinRunwayFt = 0;
                """);
                
            migrationBuilder.CreateTable(
                name: "Runways",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AirportId = table.Column<int>(type: "int", nullable: false),
                    SourceId = table.Column<int>(type: "int", nullable: false),
                    LowEndIdent = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    HighEndIdent = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    LengthFt = table.Column<int>(type: "int", nullable: true),
                    WidthFt = table.Column<int>(type: "int", nullable: true),
                    Surface = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SurfaceType = table.Column<byte>(type: "tinyint", nullable: false),
                    Lighted = table.Column<bool>(type: "bit", nullable: false),
                    HeadingDegT = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Runways", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Runways_Airports_AirportId",
                        column: x => x.AirportId,
                        principalTable: "Airports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Runways_AirportId",
                table: "Runways",
                column: "AirportId");

            migrationBuilder.CreateIndex(
                name: "IX_Runways_SourceId",
                table: "Runways",
                column: "SourceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Runways");

            migrationBuilder.DropColumn(
                name: "LongestHardRunwayFt",
                table: "Airports");

            migrationBuilder.DropColumn(
                name: "LongestRunwayFt",
                table: "Airports");

            migrationBuilder.DropColumn(
                name: "MinRunwayFt",
                table: "AircraftTypes");

            migrationBuilder.DropColumn(
                name: "RequiresPavedRunway",
                table: "AircraftTypes");
        }
    }
}
