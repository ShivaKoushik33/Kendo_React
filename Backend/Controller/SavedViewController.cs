using System.Security.Claims;
using Backend.DTOs;
using Backend.Models;
using Backend.Repositories;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SavedViewsController : ControllerBase
{
    private readonly SavedViewRepository _repository;
    private readonly ILogger<SavedViewsController> _logger;

    public SavedViewsController(SavedViewRepository repository, ILogger<SavedViewsController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult GetSavedViews()
    {
        using var _ = _logger.TraceMethod();

        int userId = GetUserId();
        var views = _repository.GetSavedViews(userId);

        _logger.LogInformation("Fetched {Count} saved views for user {UserId}", views.Count, userId);

        return Ok(views.Select(ToResponse));
    }

    [HttpGet("default")]
    public IActionResult GetDefaultView()
    {
        using var _ = _logger.TraceMethod();

        int userId = GetUserId();
        var view = _repository.GetDefaultView(userId);

        if (view == null)
        {
            // Having no default is normal, not an error - the dashboard falls back to "All".
            _logger.LogInformation("User {UserId} has no default saved view", userId);
            return NoContent();
        }

        return Ok(ToResponse(view));
    }

    [HttpPost]
    public IActionResult Create(SavedViewDto dto)
    {
        using var _ = _logger.TraceMethod();

        int userId = GetUserId();
        dto.Name = dto.Name.Trim();

        if (_repository.NameExists(userId, dto.Name))
        {
            _logger.LogWarning(
                "User {UserId} already has a saved view named '{ViewName}'", userId, dto.Name);
            return Conflict($"A view named '{dto.Name}' already exists.");
        }

        var created = _repository.Create(userId, ToStorage(dto));

        return Ok(ToResponse(created));
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, SavedViewDto dto)
    {
        using var _ = _logger.TraceMethod();

        int userId = GetUserId();
        dto.Name = dto.Name.Trim();

        if (_repository.NameExists(userId, dto.Name, excludeId: id))
        {
            _logger.LogWarning(
                "User {UserId} already has a saved view named '{ViewName}'", userId, dto.Name);
            return Conflict($"A view named '{dto.Name}' already exists.");
        }

        if (!_repository.Update(userId, id, ToStorage(dto)))
        {
            return NotFound("Saved view not found.");
        }

        return Ok("Saved view updated successfully.");
    }

    [HttpPut("{id:guid}/default")]
    public IActionResult SetDefault(Guid id)
    {
        using var _ = _logger.TraceMethod();

        if (!_repository.SetDefault(GetUserId(), id))
        {
            return NotFound("Saved view not found.");
        }

        return Ok("Default view updated successfully.");
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        using var _ = _logger.TraceMethod();

        if (!_repository.Delete(GetUserId(), id))
        {
            return NotFound("Saved view not found.");
        }

        return Ok("Saved view deleted successfully.");
    }

    // The id comes from the signed JWT, never from the request body or query string.
    private int GetUserId()
    {
        string? claim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // [Authorize] guarantees a validated token, so a missing/garbage claim means
        // the token was issued wrong - fail loudly rather than defaulting to user 0.
        if (!int.TryParse(claim, out int userId))
        {
            throw new InvalidOperationException("Authenticated token has no usable user id claim.");
        }

        return userId;
    }

    // The React filters use id 0 for "All ...". The DB uses NULL, and those columns have
    // foreign keys - a literal 0 would fail the FK because no department has Id = 0.
    private static SavedViewDto ToStorage(SavedViewDto dto)
    {
        return new SavedViewDto
        {
            Name = dto.Name,
            DepartmentId = NullIfAll(dto.DepartmentId),
            EmploymentTypeId = NullIfAll(dto.EmploymentTypeId),
            LocationId = NullIfAll(dto.LocationId),
            IsDefault = dto.IsDefault
        };
    }

    // ...and the reverse, so the client always sees the 0 convention it sends.
    private static SavedView ToResponse(SavedView view)
    {
        view.DepartmentId ??= 0;
        view.EmploymentTypeId ??= 0;
        view.LocationId ??= 0;
        return view;
    }

    private static int? NullIfAll(int? id)
    {
        return id is null or 0 ? null : id;
    }
}
