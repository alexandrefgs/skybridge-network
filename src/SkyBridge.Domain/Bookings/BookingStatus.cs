namespace SkyBridge.Domain.Bookings;

public enum BookingStatus
{
    Active = 1,
    Completed = 2,
    Cancelled = 3,
    Expired = 4
}

public enum BookingSource
{
    Freelance = 1,
    Airline = 2
}