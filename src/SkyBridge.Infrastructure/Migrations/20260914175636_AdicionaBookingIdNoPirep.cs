using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SkyBridge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaBookingIdNoPirep : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BookingId",
                table: "Pireps",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pireps_BookingId",
                table: "Pireps",
                column: "BookingId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pireps_Bookings_BookingId",
                table: "Pireps",
                column: "BookingId",
                principalTable: "Bookings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pireps_Bookings_BookingId",
                table: "Pireps");

            migrationBuilder.DropIndex(
                name: "IX_Pireps_BookingId",
                table: "Pireps");

            migrationBuilder.DropColumn(
                name: "BookingId",
                table: "Pireps");
        }
    }
}
