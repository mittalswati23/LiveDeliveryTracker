using DeliveryTracker.API.Models.Entities;
using DeliveryTracker.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DeliveryTracker.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Store enums as readable strings in SQLite rather than integers
        modelBuilder.Entity<Delivery>()
            .Property(d => d.Status)
            .HasConversion<string>();

        modelBuilder.Entity<Delivery>()
            .Property(d => d.Priority)
            .HasConversion<string>();

        modelBuilder.Entity<Delivery>()
            .HasIndex(d => d.DeliveryNumber)
            .IsUnique();

        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Email)
            .IsUnique();
    }
}
