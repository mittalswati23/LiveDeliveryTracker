using DeliveryTracker.API.Models.Entities;
using DeliveryTracker.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DeliveryTracker.API.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        var db = serviceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        if (await db.AppUsers.AnyAsync()) return; // already seeded

        // ── Dispatcher user ──────────────────────────────────────────────────
        db.AppUsers.Add(new AppUser
        {
            Email        = "dispatcher@trackr.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Trackr2025!"),
            Role         = "Dispatcher",
            DisplayName  = "SM"
        });

        // ── 5 deliveries across Seattle / Bellevue ───────────────────────────
        db.Deliveries.AddRange(

            // DLV-2837 — InTransit — SODO → Kirkland (waypoint 3 of 10)
            new Delivery
            {
                DeliveryNumber          = "DLV-2837",
                DestinationAddress      = "722 NE 45th St, Kirkland WA 98033",
                RecipientName           = "NorthGate Supplies",
                PackageWeight           = 18.5m,
                Priority                = PriorityLevel.Normal,
                Status                  = DeliveryStatus.InTransit,
                DriverId                = "D-03",
                DriverName              = "James Rivera",
                EstimatedMinutes        = 22,
                TotalRouteDistanceMiles = 12.3m,
                CurrentWaypointIndex    = 3,
                CurrentLatitude         = 47.6141,
                CurrentLongitude        = -122.2892,
                DispatchedAt            = DateTime.UtcNow.AddMinutes(-18),
                RouteWaypoints          = """
                    [{"lat":47.5795,"lon":-122.3267},{"lat":47.5883,"lon":-122.3178},
                     {"lat":47.6012,"lon":-122.3044},{"lat":47.6141,"lon":-122.2892},
                     {"lat":47.6255,"lon":-122.2741},{"lat":47.6341,"lon":-122.2601},
                     {"lat":47.6429,"lon":-122.2464},{"lat":47.6512,"lon":-122.2341},
                     {"lat":47.6578,"lon":-122.2228},{"lat":47.6634,"lon":-122.2102}]
                    """
            },

            // DLV-2838 — InTransit — SODO → Bellevue Downtown (waypoint 5 of 10)
            new Delivery
            {
                DeliveryNumber          = "DLV-2838",
                DestinationAddress      = "600 Bellevue Way NE, Bellevue WA 98004",
                RecipientName           = "Cascade Office Partners",
                PackageWeight           = 9.2m,
                Priority                = PriorityLevel.High,
                Status                  = DeliveryStatus.InTransit,
                DriverId                = "D-05",
                DriverName              = "Sarah Chen",
                EstimatedMinutes        = 14,
                TotalRouteDistanceMiles = 8.7m,
                CurrentWaypointIndex    = 5,
                CurrentLatitude         = 47.6152,
                CurrentLongitude        = -122.2015,
                DispatchedAt            = DateTime.UtcNow.AddMinutes(-25),
                RouteWaypoints          = """
                    [{"lat":47.5795,"lon":-122.3267},{"lat":47.5851,"lon":-122.3101},
                     {"lat":47.5912,"lon":-122.2821},{"lat":47.5978,"lon":-122.2554},
                     {"lat":47.6072,"lon":-122.2301},{"lat":47.6152,"lon":-122.2015},
                     {"lat":47.6198,"lon":-122.1921},{"lat":47.6221,"lon":-122.1851},
                     {"lat":47.6238,"lon":-122.1802},{"lat":47.6249,"lon":-122.1768}]
                    """
            },

            // DLV-2839 — Pickup — warehouse staging (waypoint 0 of 10)
            new Delivery
            {
                DeliveryNumber          = "DLV-2839",
                DestinationAddress      = "900 Rainier Ave S, Renton WA 98057",
                RecipientName           = "Renton Fabrication Co.",
                PackageWeight           = 42.0m,
                Priority                = PriorityLevel.Low,
                Status                  = DeliveryStatus.Pickup,
                DriverId                = "D-02",
                DriverName              = "Priya Nair",
                EstimatedMinutes        = 38,
                TotalRouteDistanceMiles = 9.1m,
                CurrentWaypointIndex    = 0,
                CurrentLatitude         = 47.5795,
                CurrentLongitude        = -122.3267,
                DispatchedAt            = DateTime.UtcNow.AddMinutes(-3),
                RouteWaypoints          = """
                    [{"lat":47.5795,"lon":-122.3267},{"lat":47.5712,"lon":-122.3189},
                     {"lat":47.5638,"lon":-122.3121},{"lat":47.5559,"lon":-122.3044},
                     {"lat":47.5478,"lon":-122.2981},{"lat":47.5389,"lon":-122.2912},
                     {"lat":47.5298,"lon":-122.2851},{"lat":47.5211,"lon":-122.2782},
                     {"lat":47.5132,"lon":-122.2711},{"lat":47.5051,"lon":-122.2154}]
                    """
            },

            // DLV-2840 — Delayed — stalled on I-405 (waypoint 2 of 10)
            new Delivery
            {
                DeliveryNumber          = "DLV-2840",
                DestinationAddress      = "1201 Monster Rd SW, Renton WA 98057",
                RecipientName           = "Apex Logistics Hub",
                PackageWeight           = 31.8m,
                Priority                = PriorityLevel.High,
                Status                  = DeliveryStatus.Delayed,
                DriverId                = "D-08",
                DriverName              = "Derek Okonkwo",
                EstimatedMinutes        = 55,
                TotalRouteDistanceMiles = 11.2m,
                CurrentWaypointIndex    = 2,
                CurrentLatitude         = 47.5621,
                CurrentLongitude        = -122.1871,
                DispatchedAt            = DateTime.UtcNow.AddMinutes(-47),
                RouteWaypoints          = """
                    [{"lat":47.5795,"lon":-122.3267},{"lat":47.5698,"lon":-122.2791},
                     {"lat":47.5621,"lon":-122.1871},{"lat":47.5541,"lon":-122.1641},
                     {"lat":47.5449,"lon":-122.1501},{"lat":47.5362,"lon":-122.1388},
                     {"lat":47.5271,"lon":-122.1281},{"lat":47.5182,"lon":-122.1178},
                     {"lat":47.5091,"lon":-122.1071},{"lat":47.5001,"lon":-122.0961}]
                    """
            },

            // DLV-2841 — Nearby — almost at destination (waypoint 7 of 10)
            new Delivery
            {
                DeliveryNumber          = "DLV-2841",
                DestinationAddress      = "1420 Harbor Blvd, Bellevue WA 98004",
                RecipientName           = "BuildCo Inc.",
                PackageWeight           = 24.0m,
                Priority                = PriorityLevel.High,
                Status                  = DeliveryStatus.Nearby,
                DriverId                = "D-07",
                DriverName              = "Marcus Thompson",
                EstimatedMinutes        = 4,
                TotalRouteDistanceMiles = 6.4m,
                CurrentWaypointIndex    = 7,
                CurrentLatitude         = 47.6035,
                CurrentLongitude        = -122.3388,
                DispatchedAt            = DateTime.UtcNow.AddMinutes(-41),
                RouteWaypoints          = """
                    [{"lat":47.5951,"lon":-122.3317},{"lat":47.5965,"lon":-122.3328},
                     {"lat":47.5979,"lon":-122.3341},{"lat":47.5995,"lon":-122.3355},
                     {"lat":47.6012,"lon":-122.3368},{"lat":47.6020,"lon":-122.3374},
                     {"lat":47.6028,"lon":-122.3381},{"lat":47.6035,"lon":-122.3388},
                     {"lat":47.6048,"lon":-122.3401},{"lat":47.6062,"lon":-122.3321}]
                    """
            }
        );

        await db.SaveChangesAsync();
    }
}
