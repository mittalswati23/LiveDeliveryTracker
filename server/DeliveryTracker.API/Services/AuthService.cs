using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DeliveryTracker.API.Data;
using DeliveryTracker.API.Models.DTOs;
using DeliveryTracker.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DeliveryTracker.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AppUser?> ValidateUserAsync(string email, string password)
    {
        var user = await _db.AppUsers
            .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());

        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;

        return user;
    }

    public LoginResponseDto GenerateToken(AppUser user)
    {
        var secret  = _config["Jwt:Secret"]!;
        var issuer  = _config["Jwt:Issuer"]!;
        var audience = _config["Jwt:Audience"]!;
        var expiryHours = _config.GetValue<int>("Jwt:ExpiryHours", 8);

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("role",        user.Role),
            new Claim("displayName", user.DisplayName)
        };

        var expiresAt = DateTime.UtcNow.AddHours(expiryHours);

        var token = new JwtSecurityToken(
            issuer:             issuer,
            audience:           audience,
            claims:             claims,
            expires:            expiresAt,
            signingCredentials: creds
        );

        return new LoginResponseDto(
            Token:       new JwtSecurityTokenHandler().WriteToken(token),
            Email:       user.Email,
            DisplayName: user.DisplayName,
            Role:        user.Role,
            ExpiresAt:   expiresAt
        );
    }
}
