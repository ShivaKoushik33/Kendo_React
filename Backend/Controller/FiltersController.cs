using Backend.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FiltersController : ControllerBase
{
    private readonly FilterRepository _repository;

   
   public  FiltersController(FilterRepository repository)
    {
        _repository = repository;
    }   
    [HttpGet]
    public IActionResult GetFilters()
    {
        var filters = _repository.GetFilters();

        return Ok(filters);
    }
}