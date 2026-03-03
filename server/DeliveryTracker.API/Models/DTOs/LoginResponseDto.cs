namespace DeliveryTracker.API.Models.DTOs;

public record LoginResponseDto(
    string Token,
    string Email,
    string DisplayName,
    string Role,
    DateTime ExpiresAt
);
