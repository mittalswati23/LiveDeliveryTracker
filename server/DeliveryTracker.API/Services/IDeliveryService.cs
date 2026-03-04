using DeliveryTracker.API.Models.DTOs;

namespace DeliveryTracker.API.Services;

public interface IDeliveryService
{
    Task<IEnumerable<DeliveryDto>> GetAllAsync();
    Task<DeliveryDto?> GetByIdAsync(int id);
    Task<bool> UpdateStatusAsync(int id, string status);
    Task<IEnumerable<LocationDto>> GetLocationHistoryAsync(int deliveryId);
}
