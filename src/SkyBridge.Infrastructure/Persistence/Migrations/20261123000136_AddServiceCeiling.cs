using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceCeiling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ServiceCeilingFt",
                table: "AircraftTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                UPDATE t SET t.ServiceCeilingFt = v.Ceiling
                FROM AircraftTypes t
                JOIN (VALUES
                    ('C152', 14700), ('C172', 14000), ('P28A', 13240), ('SR22', 17500), ('DA40', 16400),
                    ('DA62', 20000), ('BE58', 20688), ('PA34', 25000),
                    ('C208', 25000), ('KODI', 25000), ('TBM9', 31000), ('PC12', 30000), ('B350', 35000),
                    ('AT76', 25000), ('DH8D', 27000), ('E175', 41000), ('E190', 41000), ('E195', 41000), ('CRJ9', 41000),
                    ('E50P', 41000), ('E55P', 45000), ('HDJT', 43000), ('C25C', 45000),
                    ('C68A', 45000), ('C700', 45000), ('CL35', 45000), ('LJ75', 51000),
                    ('GLF6', 51000), ('GL7T', 51000), ('FA7X', 51000),
                    ('A319', 39800), ('A320', 39800), ('A20N', 39800), ('A21N', 39800),
                    ('B737', 41000), ('B738', 41000), ('B38M', 41000), ('B739', 41000),
                    ('A332', 41450), ('A339', 41450), ('A359', 43100), ('A388', 43000),
                    ('B772', 43100), ('B77W', 43100), ('B788', 43000), ('B789', 43000), ('B748', 43100)
                ) AS v(IcaoCode, Ceiling) ON t.IcaoCode = v.IcaoCode;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ServiceCeilingFt",
                table: "AircraftTypes");
        }
    }
}