using System.ComponentModel.DataAnnotations;

namespace DeliveryTracker.API.Models.DTOs;

public record UpdateStatusDto(
    [Required] string Status
);
