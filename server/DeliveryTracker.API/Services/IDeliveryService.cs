using DeliveryTracker.API.Models.DTOs;
using DeliveryTracker.API.Models.Enums;

namespace DeliveryTracker.API.Services;

public interface IDeliveryService
{
    Task<IEnumerable<DeliveryDto>> GetAllAsync();
    Task<DeliveryDto?> GetByIdAsync(int id);
    Task<bool> UpdateStatusAsync(int id, DeliveryStatus status);
    Task<IEnumerable<LocationDto>> GetLocationHistoryAsync(int deliveryId);
}
