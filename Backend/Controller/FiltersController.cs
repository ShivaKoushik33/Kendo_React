using Backend.Repositories;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FiltersController : ControllerBase
{
    private readonly FilterRepository _repository;
    private readonly ILogger<FiltersController> _logger;

   public FiltersController(FilterRepository repository, ILogger<FiltersController> logger)
    {
        _repository = repository;
        _logger = logger;
    }   
    [HttpGet]
    public IActionResult GetFilters()
    {
        using var _ = _logger.TraceMethod();

        var filters = _repository.GetFilters();

        return Ok(filters);
    }
}
