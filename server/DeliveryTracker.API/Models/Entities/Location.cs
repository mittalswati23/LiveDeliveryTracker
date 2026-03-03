namespace DeliveryTracker.API.Models.Entities;

public class Location
{
    public int Id { get; set; }
    public int DeliveryId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public int WaypointIndex { get; set; }

    public Delivery Delivery { get; set; } = null!;
}
