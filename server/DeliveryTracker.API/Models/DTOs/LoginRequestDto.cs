using System.ComponentModel.DataAnnotations;

namespace DeliveryTracker.API.Models.DTOs;

public record LoginRequestDto(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password
);
