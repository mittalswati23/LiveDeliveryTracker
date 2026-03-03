namespace DeliveryTracker.API.Models.DTOs;

public record LocationDto(
    int DeliveryId,
    string DeliveryNumber,
    string Status,
    double Latitude,
    double Longitude,
    DateTime Timestamp,
    int WaypointIndex
);
