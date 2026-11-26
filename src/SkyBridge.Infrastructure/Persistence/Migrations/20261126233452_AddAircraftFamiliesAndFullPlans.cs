using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAircraftFamiliesAndFullPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DetailsJson",
                table: "FlightPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Family",
                table: "AircraftTypes",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE AircraftTypes SET Family = CASE IcaoCode
                    WHEN 'E50P' THEN 'Embraer Phenom'
                    WHEN 'E55P' THEN 'Embraer Phenom'
                    WHEN 'C68A' THEN 'Cessna Citation'
                    WHEN 'C700' THEN 'Cessna Citation'
                    WHEN 'AT76' THEN 'ATR 42/72'
                    WHEN 'DH8D' THEN 'Dash 8'
                    WHEN 'E175' THEN 'Embraer E-Jet'
                    WHEN 'E190' THEN 'Embraer E-Jet'
                    WHEN 'E195' THEN 'Embraer E-Jet'
                    WHEN 'CRJ9' THEN 'Bombardier CRJ'
                    WHEN 'A319' THEN 'Airbus A320'
                    WHEN 'A320' THEN 'Airbus A320'
                    WHEN 'A20N' THEN 'Airbus A320'
                    WHEN 'A21N' THEN 'Airbus A320'
                    WHEN 'B737' THEN 'Boeing 737'
                    WHEN 'B738' THEN 'Boeing 737'
                    WHEN 'B38M' THEN 'Boeing 737'
                    WHEN 'B739' THEN 'Boeing 737'
                    WHEN 'A332' THEN 'Airbus A330'
                    WHEN 'A339' THEN 'Airbus A330'
                    WHEN 'A359' THEN 'Airbus A350'
                    WHEN 'A388' THEN 'Airbus A380'
                    WHEN 'B772' THEN 'Boeing 777'
                    WHEN 'B77W' THEN 'Boeing 777'
                    WHEN 'B788' THEN 'Boeing 787'
                    WHEN 'B789' THEN 'Boeing 787'
                    WHEN 'B748' THEN 'Boeing 747'
                END
                WHERE IcaoCode IN ('E50P', 'E55P', 'C68A', 'C700', 'AT76', 'DH8D', 'E175', 'E190', 'E195', 'CRJ9', 'A319', 'A320', 'A20N', 'A21N', 'B737', 'B738', 'B38M', 'B739', 'A332', 'A339', 'A359', 'A388', 'B772', 'B77W', 'B788', 'B789', 'B748')
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DetailsJson",
                table: "FlightPlans");

            migrationBuilder.DropColumn(
                name: "Family",
                table: "AircraftTypes");
        }
    }
}