using DeliveryTracker.API.Models.DTOs;
using DeliveryTracker.API.Models.Entities;

namespace DeliveryTracker.API.Services;

public interface IAuthService
{
    Task<AppUser?> ValidateUserAsync(string email, string password);
    LoginResponseDto GenerateToken(AppUser user);
}
