namespace DeliveryTracker.API.Models.Entities;

public class AppUser
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Dispatcher";
    public string DisplayName { get; set; } = string.Empty;
}
