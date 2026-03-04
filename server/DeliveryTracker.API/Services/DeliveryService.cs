using DeliveryTracker.API.Data;
using DeliveryTracker.API.Models.DTOs;
using DeliveryTracker.API.Models.Entities;
using DeliveryTracker.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DeliveryTracker.API.Services;

public class DeliveryService : IDeliveryService
{
    private readonly AppDbContext _db;

    public DeliveryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<DeliveryDto>> GetAllAsync()
    {
        var deliveries = await _db.Deliveries
            .OrderBy(d => d.DeliveryNumber)
            .ToListAsync();

        return deliveries.Select(ToDto);
    }

    public async Task<DeliveryDto?> GetByIdAsync(int id)
    {
        var delivery = await _db.Deliveries.FindAsync(id);
        return delivery is null ? null : ToDto(delivery);
    }

    public async Task<bool> UpdateStatusAsync(int id, DeliveryStatus status)
    {
        var delivery = await _db.Deliveries.FindAsync(id);
        if (delivery is null) return false;

        delivery.Status = status;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<LocationDto>> GetLocationHistoryAsync(int deliveryId)
    {
        var delivery = await _db.Deliveries
            .Where(d => d.Id == deliveryId)
            .Select(d => new { d.DeliveryNumber, d.Status })
            .FirstOrDefaultAsync();

        if (delivery is null) return [];

        var locations = await _db.Locations
            .Where(l => l.DeliveryId == deliveryId)
            .OrderBy(l => l.Timestamp)
            .ToListAsync();

        return locations.Select(l => new LocationDto(
            DeliveryId:     l.DeliveryId,
            DeliveryNumber: delivery.DeliveryNumber,
            Status:         delivery.Status.ToString(),
            Latitude:       l.Latitude,
            Longitude:      l.Longitude,
            Timestamp:      l.Timestamp,
            WaypointIndex:  l.WaypointIndex
        ));
    }

    private static DeliveryDto ToDto(Delivery d) => new(
        Id:                     d.Id,
        DeliveryNumber:         d.DeliveryNumber,
        DestinationAddress:     d.DestinationAddress,
        RecipientName:          d.RecipientName,
        PackageWeight:          d.PackageWeight,
        Priority:               d.Priority.ToString(),
        Status:                 d.Status.ToString(),
        DriverId:               d.DriverId,
        DriverName:             d.DriverName,
        EstimatedMinutes:       d.EstimatedMinutes,
        TotalRouteDistanceMiles: d.TotalRouteDistanceMiles,
        CurrentLatitude:        d.CurrentLatitude,
        CurrentLongitude:       d.CurrentLongitude,
        CurrentWaypointIndex:   d.CurrentWaypointIndex,
        TotalWaypoints:         CountWaypoints(d.RouteWaypoints),
        DispatchedAt:           d.DispatchedAt
    );

    private static int CountWaypoints(string json)
    {
        // Fast count — avoids full JSON parse just to get array length
        return json.Count(c => c == '{');
    }
}
