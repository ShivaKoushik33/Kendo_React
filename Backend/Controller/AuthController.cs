using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Identity;
using Backend.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;
    private readonly PasswordHasher<string> _passwordHasher;

    public AuthController(IConfiguration configuration, IWebHostEnvironment env)
    {
        _configuration = configuration;
        _env = env;
        _passwordHasher = new PasswordHasher<string>();
    }

    [HttpPost("signup")]
    public IActionResult SignUp(SignUPDto dto)
    {
        string connectionString =
    _configuration.GetConnectionString("DefaultConnection")!;

        using SqlConnection connection =
            new SqlConnection(connectionString);

        connection.Open();

        string checkQuery = "select count(*) from users where  email=@email";
        using SqlCommand checkCommand = new SqlCommand(checkQuery, connection);

        checkCommand.Parameters.AddWithValue("@Email", dto.mail);
        int existingUser =
            Convert.ToInt32(checkCommand.ExecuteScalar());

        if (existingUser > 0)
        {
            return Conflict("Email already registered.");
        }
        string passwordHash = _passwordHasher.HashPassword(dto.mail, dto.Password);

        string query = @" INSERT INTO Users (Email, PasswordHash) VALUES (@Email, @PasswordHash)";
        using SqlCommand command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Email", dto.mail);
        command.Parameters.AddWithValue("@PasswordHash", passwordHash);
        int rowsAffected = command.ExecuteNonQuery();

        if (rowsAffected == 0)
        {
            return BadRequest("Unable to create account.");
        }

        return Ok("Account created successfully.");
    }

    [HttpPost("login")]
    public IActionResult Login(LoginDto dto)
    {
        string connectionString =
            _configuration.GetConnectionString("DefaultConnection")!;

        using SqlConnection connection =
            new SqlConnection(connectionString);

        connection.Open();

        string query = @"
            SELECT Id, Email, PasswordHash
            FROM Users
            WHERE Email = @Email";

        using SqlCommand command =
            new SqlCommand(query, connection);

        command.Parameters.AddWithValue("@Email", dto.Email);

        int userId;
        string email;
        string passwordHash;

        using (SqlDataReader reader = command.ExecuteReader())
        {
            if (!reader.Read())
            {
                return Unauthorized("Invalid email or password.");
            }

            userId = Convert.ToInt32(reader["Id"]);
            email = reader["Email"].ToString()!;
            passwordHash = reader["PasswordHash"].ToString()!;
        }

        var passwordHasher = new PasswordHasher<string>();

        var result = passwordHasher.VerifyHashedPassword(
            email,
            passwordHash,
            dto.Password
        );

        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized("Invalid email or password.");
        }

        string refreshToken = GenerateRefreshToken();
        DateTime refreshExpiry = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays());

        StoreRefreshToken(connection, userId, refreshToken, refreshExpiry);
        SetRefreshTokenCookie(refreshToken, refreshExpiry);

        string token = GenerateJwtToken(userId, email);

        return Ok(new { accessToken = token });
    }

    [HttpPost("refresh")]
    public IActionResult Refresh()
    {
        if (!Request.Cookies.TryGetValue("RefreshToken", out var refreshToken) ||
            string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized("Refresh token missing.");
        }

        string connectionString =
            _configuration.GetConnectionString("DefaultConnection")!;

        using SqlConnection connection =
            new SqlConnection(connectionString);

        connection.Open();

        string query = @"
            SELECT Id, Email
            FROM Users
            WHERE RefreshToken = @RefreshToken AND RefreshTokenExpiry > GETUTCDATE()";

        using SqlCommand command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@RefreshToken", refreshToken);

        int userId;
        string email;

        using (SqlDataReader reader = command.ExecuteReader())
        {
            if (!reader.Read())
            {
                return Unauthorized("Invalid or expired refresh token.");
            }

            userId = Convert.ToInt32(reader["Id"]);
            email = reader["Email"].ToString()!;
        }

        string newRefreshToken = GenerateRefreshToken();
        DateTime refreshExpiry = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays());

        StoreRefreshToken(connection, userId, newRefreshToken, refreshExpiry);
        SetRefreshTokenCookie(newRefreshToken, refreshExpiry);

        string accessToken = GenerateJwtToken(userId, email);

        return Ok(new { accessToken });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        if (Request.Cookies.TryGetValue("RefreshToken", out var refreshToken) &&
            !string.IsNullOrEmpty(refreshToken))
        {
            string connectionString =
                _configuration.GetConnectionString("DefaultConnection")!;

            using SqlConnection connection =
                new SqlConnection(connectionString);

            connection.Open();

            string query = "UPDATE Users SET RefreshToken = NULL, RefreshTokenExpiry = NULL WHERE RefreshToken = @RefreshToken";
            using SqlCommand command = new SqlCommand(query, connection);
            command.Parameters.AddWithValue("@RefreshToken", refreshToken);
            command.ExecuteNonQuery();
        }

        Response.Cookies.Delete("RefreshToken");

        return Ok("Logged out.");
    }

    private void StoreRefreshToken(SqlConnection connection, int userId, string refreshToken, DateTime expiry)
    {
        string updateQuery = "UPDATE Users SET RefreshToken = @RefreshToken, RefreshTokenExpiry = @Expiry WHERE Id = @Id";
        using SqlCommand updateCommand = new SqlCommand(updateQuery, connection);
        updateCommand.Parameters.AddWithValue("@RefreshToken", refreshToken);
        updateCommand.Parameters.AddWithValue("@Expiry", expiry);
        updateCommand.Parameters.AddWithValue("@Id", userId);
        updateCommand.ExecuteNonQuery();
    }

    private static string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }

    private double RefreshTokenExpiryDays()
    {
        return double.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");
    }

    private void SetRefreshTokenCookie(string token, DateTime expiry)
    {
        Response.Cookies.Append("RefreshToken", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Expires = expiry
        });
    }

    private string GenerateJwtToken(int userId, string email)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"]!
            )
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        double expiryMinutes = double.Parse(_configuration["Jwt:AccessTokenExpiryMinutes"] ?? "15");

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

}
