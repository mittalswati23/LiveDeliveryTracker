using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace DeliveryTracker.Tests;

public class DeliveryControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public DeliveryControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetBearerTokenAsync()
    {
        var res = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email    = "dispatcher@trackr.io",
            password = "Trackr2025!"
        });
        var body = await res.Content.ReadFromJsonAsync<LoginResponse>();
        return body!.Token;
    }

    // ── Unauthenticated requests ──────────────────────────────────────────────

    [Fact]
    public async Task GetDeliveries_NoToken_Returns401()
    {
        var response = await _client.GetAsync("/api/deliveries");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetDeliveryById_NoToken_Returns401()
    {
        var response = await _client.GetAsync("/api/deliveries/1");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Authenticated requests ────────────────────────────────────────────────

    [Fact]
    public async Task GetDeliveries_WithToken_Returns12Deliveries()
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await GetBearerTokenAsync());

        var response = await _client.GetAsync("/api/deliveries");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var deliveries = await response.Content.ReadFromJsonAsync<List<JsonElement>>();
        Assert.Equal(5, deliveries!.Count);
    }

    [Fact]
    public async Task GetDeliveryById_ValidId_ReturnsDelivery()
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await GetBearerTokenAsync());

        var response = await _client.GetAsync("/api/deliveries/1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var delivery = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, delivery.GetProperty("id").GetInt32());
    }

    [Fact]
    public async Task GetDeliveryById_UnknownId_Returns404()
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await GetBearerTokenAsync());

        var response = await _client.GetAsync("/api/deliveries/9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_ValidStatus_Returns204()
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await GetBearerTokenAsync());

        var response = await _client.PutAsJsonAsync(
            "/api/deliveries/1/status", new { status = "Delivered" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateStatus_InvalidStatus_Returns400()
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", await GetBearerTokenAsync());

        var response = await _client.PutAsJsonAsync(
            "/api/deliveries/1/status", new { status = "NotARealStatus" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
