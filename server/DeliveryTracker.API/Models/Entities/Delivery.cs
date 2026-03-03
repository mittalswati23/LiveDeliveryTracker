using DeliveryTracker.API.Models.Enums;

namespace DeliveryTracker.API.Models.Entities;

public class Delivery
{
    public int Id { get; set; }
    public string DeliveryNumber { get; set; } = string.Empty;
    public string DestinationAddress { get; set; } = string.Empty;
    public string RecipientName { get; set; } = string.Empty;
    public decimal PackageWeight { get; set; }
    public PriorityLevel Priority { get; set; } = PriorityLevel.Normal;
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Pickup;
    public string DriverId { get; set; } = string.Empty;
    public string DriverName { get; set; } = string.Empty;
    public string OriginAddress { get; set; } = "Trackr Warehouse, 4200 6th Ave S, Seattle";
    public int EstimatedMinutes { get; set; }
    public decimal TotalRouteDistanceMiles { get; set; }
    public string RouteWaypoints { get; set; } = "[]";

    // Simulator state — updated every tick
    public int CurrentWaypointIndex { get; set; } = 0;
    public double CurrentLatitude { get; set; }
    public double CurrentLongitude { get; set; }

    public DateTime DispatchedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Location> Locations { get; set; } = new List<Location>();
}
