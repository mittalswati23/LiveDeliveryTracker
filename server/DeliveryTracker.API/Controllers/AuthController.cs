using DeliveryTracker.API.Models.DTOs;
using DeliveryTracker.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeliveryTracker.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth)
    {
        _auth = auth;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var user = await _auth.ValidateUserAsync(request.Email, request.Password);

        if (user is null)
            return Unauthorized(new { message = "Invalid email or password" });

        return Ok(_auth.GenerateToken(user));
    }
}
