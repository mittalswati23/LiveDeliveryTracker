using DeliveryTracker.API.Data;
using DeliveryTracker.API.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Application Services ──────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();

var app = builder.Build();

// Seed database on startup
using (var scope = app.Services.CreateScope())
    await SeedData.InitializeAsync(scope.ServiceProvider);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();
