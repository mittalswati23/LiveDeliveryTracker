using DeliveryTracker.API.Models.DTOs;
using DeliveryTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeliveryTracker.API.Controllers;

[ApiController]
[Route("api/deliveries")]
[Authorize]
public class DeliveryController : ControllerBase
{
    private readonly IDeliveryService _delivery;

    public DeliveryController(IDeliveryService delivery)
    {
        _delivery = delivery;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DeliveryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var deliveries = await _delivery.GetAllAsync();
        return Ok(deliveries);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(DeliveryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var delivery = await _delivery.GetByIdAsync(id);
        return delivery is null ? NotFound() : Ok(delivery);
    }

    [HttpPut("{id:int}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        var updated = await _delivery.UpdateStatusAsync(id, dto.Status);
        return updated ? NoContent() : NotFound();
    }
}
