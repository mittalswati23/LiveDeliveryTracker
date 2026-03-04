using System.Text.Json;
using DeliveryTracker.API.Data;
using DeliveryTracker.API.Hubs;
using DeliveryTracker.API.Models;
using DeliveryTracker.API.Models.DTOs;
using DeliveryTracker.API.Models.Entities;
using DeliveryTracker.API.Models.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DeliveryTracker.API.Services;

public class LocationSimulatorService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<LocationHub> _hub;
    private readonly ILogger<LocationSimulatorService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(3);

    public LocationSimulatorService(
        IServiceScopeFactory scopeFactory,
        IHubContext<LocationHub> hub,
        ILogger<LocationSimulatorService> logger)
    {
        _scopeFactory = scopeFactory;
        _hub          = hub;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Location simulator started");

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(Interval, stoppingToken);

            try
            {
                await TickAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Simulator tick failed");
            }
        }
    }

    private async Task TickAsync(CancellationToken ct)
    {
        // IServiceScopeFactory required — DbContext is scoped, BackgroundService is singleton
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var active = await db.Deliveries
            .Where(d => d.Status == DeliveryStatus.InTransit || d.Status == DeliveryStatus.Nearby)
            .ToListAsync(ct);

        foreach (var delivery in active)
        {
            var waypoints = ParseWaypoints(delivery.RouteWaypoints);
            if (waypoints.Length == 0) continue;

            var nextIndex = delivery.CurrentWaypointIndex + 1;

            // Loop back to start when the end of the route is reached
            if (nextIndex >= waypoints.Length)
            {
                nextIndex = 0;
                delivery.Status = DeliveryStatus.InTransit;
            }

            var wp = waypoints[nextIndex];
            delivery.CurrentWaypointIndex = nextIndex;
            delivery.CurrentLatitude      = wp.Lat;
            delivery.CurrentLongitude     = wp.Lon;

            // Set Nearby when approaching the final waypoint
            if (nextIndex >= waypoints.Length - 2)
                delivery.Status = DeliveryStatus.Nearby;

            db.Locations.Add(new Location
            {
                DeliveryId    = delivery.Id,
                Latitude      = wp.Lat,
                Longitude     = wp.Lon,
                Timestamp     = DateTime.UtcNow,
                WaypointIndex = nextIndex
            });

            var dto = new LocationDto(
                DeliveryId:     delivery.Id,
                DeliveryNumber: delivery.DeliveryNumber,
                Status:         delivery.Status.ToString(),
                Latitude:       wp.Lat,
                Longitude:      wp.Lon,
                Timestamp:      DateTime.UtcNow,
                WaypointIndex:  nextIndex
            );

            await _hub.Clients.Group("all-deliveries").SendAsync("LocationUpdate", dto, ct);
        }

        await db.SaveChangesAsync(ct);
    }

    private static Waypoint[] ParseWaypoints(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<Waypoint[]>(
                json.Trim(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            ) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
