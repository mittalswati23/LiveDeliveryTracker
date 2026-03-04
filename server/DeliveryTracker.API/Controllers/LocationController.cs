using DeliveryTracker.API.Models.DTOs;
using DeliveryTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeliveryTracker.API.Controllers;

[ApiController]
[Route("api/locations")]
[Authorize]
public class LocationController : ControllerBase
{
    private readonly IDeliveryService _delivery;

    public LocationController(IDeliveryService delivery)
    {
        _delivery = delivery;
    }

    [HttpGet("{deliveryId:int}")]
    [ProducesResponseType(typeof(IEnumerable<LocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHistory(int deliveryId)
    {
        var history = await _delivery.GetLocationHistoryAsync(deliveryId);
        return Ok(history);
    }
}
