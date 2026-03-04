using DeliveryTracker.API.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DeliveryTracker.Tests;

/// <summary>
/// Spins up the real ASP.NET Core pipeline against a temporary SQLite file.
/// The LocationSimulatorService is removed so it doesn't mutate DB state during tests.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // Unique temp DB per factory instance — isolates test classes from each other
    private readonly string _dbPath =
        Path.Combine(Path.GetTempPath(), $"trackr-test-{Guid.NewGuid()}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={_dbPath}",
                // Test-only JWT secret — real secret is in gitignored appsettings.Development.json
                ["Jwt:Secret"]    = "TrackrTestSecretKeyLongEnoughFor256Bits!!",
                ["Jwt:Issuer"]    = "trackr-api",
                ["Jwt:Audience"]  = "trackr-client",
                ["Cors:AllowedOrigins:0"] = "http://localhost",
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove the background location simulator — it mutates delivery rows
            // while tests are running and causes assertion flakiness
            var descriptor = services.SingleOrDefault(
                d => d.ImplementationType == typeof(LocationSimulatorService));
            if (descriptor != null) services.Remove(descriptor);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (File.Exists(_dbPath)) File.Delete(_dbPath);
    }
}

// Mirrors LoginResponseDto returned by POST /api/auth/login
public record LoginResponse(
    string Token,
    string Email,
    string DisplayName,
    string Role,
    string ExpiresAt);
