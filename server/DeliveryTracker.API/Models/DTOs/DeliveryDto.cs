namespace DeliveryTracker.API.Models.DTOs;

public record DeliveryDto(
    int Id,
    string DeliveryNumber,
    string DestinationAddress,
    string RecipientName,
    decimal PackageWeight,
    string Priority,
    string Status,
    string DriverId,
    string DriverName,
    int EstimatedMinutes,
    decimal TotalRouteDistanceMiles,
    double CurrentLatitude,
    double CurrentLongitude,
    int CurrentWaypointIndex,
    int TotalWaypoints,
    DateTime DispatchedAt
);
