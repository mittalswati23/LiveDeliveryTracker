using System.ComponentModel.DataAnnotations;
using DeliveryTracker.API.Models.Enums;

namespace DeliveryTracker.API.Models.DTOs;

public record UpdateStatusDto(
    [Required] DeliveryStatus Status
);
