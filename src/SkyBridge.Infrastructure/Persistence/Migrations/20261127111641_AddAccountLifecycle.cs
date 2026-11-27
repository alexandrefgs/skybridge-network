using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AcceptedRegulationsVersion",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeactivatedAtUtc",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActiveAtUtc",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AddColumn<DateTime>(
                name: "ReactivationReadyAtUtc",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RegulationsAcceptedAtUtc",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_LastActiveAtUtc",
                table: "AspNetUsers",
                column: "LastActiveAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_LastActiveAtUtc",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AcceptedRegulationsVersion",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "DeactivatedAtUtc",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastActiveAtUtc",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ReactivationReadyAtUtc",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "RegulationsAcceptedAtUtc",
                table: "AspNetUsers");
        }
    }
}
