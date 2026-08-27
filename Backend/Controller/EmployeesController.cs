using Backend.Repositories;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly ILogger<EmployeesController> _logger;
   
    private readonly EmployeeRepository _repository;

    public EmployeesController(EmployeeRepository repository,ILogger<EmployeesController> logger)
    {
        _logger=logger;
        _repository = repository;
    }

    [HttpGet]
    public IActionResult GetEmployees()
    {
        using var _ = _logger.TraceMethod();

        var employees = _repository.GetEmployees();
        _logger.LogInformation("Fetched {Count} employees", employees.Count);

        return Ok(employees);
    }

    [HttpGet("{id}")]
    public IActionResult GetEmployeeById(int id)
    {
        using var _ = _logger.TraceMethod();

        var employee = _repository.GetEmployeeById(id);

        if (employee == null)
        {
            _logger.LogWarning("Employee {Id} not found", id);
            return NotFound($"Employee with {id} Not found bete");
        }

        _logger.LogInformation("Employee {Id} fetched", id);
        return Ok(employee);
    }

    [HttpGet("paginated")]
    public IActionResult GetEmployeesPaginated(int offset = 1, int size = 10)
    {
        if (offset < 1 || size < 1)
        {
            return BadRequest("offset must be at least 1 and size must be positive");
        }

        int start=(offset-1)*size;
        var employees=_repository.GetEmployeesPaginated(start,size);
        var total = _repository.GetEmployeeCount();
        _logger.LogInformation("Fetched {Count} employees from page {Page} with total {Total}", employees.Count, offset, total);

        return Ok(new { data = employees, total });
    }

    [HttpPost]
    public IActionResult AddEmployee(Employee employee)
    {
        using var _ = _logger.TraceMethod();

        bool result = _repository.AddEmployee(employee);

        if (result)
        {
            _logger.LogInformation("Employee {Name} added", employee.Name);
            return Ok("Employee Added Successfully");
        }

        _logger.LogWarning("Failed to add employee {Name}", employee.Name);
        return BadRequest("Unable to Add Employee");
    }

    [HttpPut("{id}")]
    public IActionResult UpdateEmployee(int id, Employee employee)
    {
        using var _ = _logger.TraceMethod();

        employee.Id = id;

        bool result = _repository.UpdateEmployee(employee);

        if (result)
        {
            _logger.LogInformation("Employee {Id} updated", id);
            return Ok("Employee Updated Successfully");
        }

        _logger.LogWarning("Employee {Id} not found for update", id);
        return NotFound("Employee Not Found");
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteEmployee(int id)
    {
        using var _ = _logger.TraceMethod();

        bool result = _repository.DeleteEmployee(id);

        if (result)
        {
            _logger.LogInformation("Employee {Id} deleted", id);
            return Ok("Employee Deleted Successfully");
        }

        _logger.LogWarning("Employee {Id} not found for delete", id);
        return NotFound("Employee Not Found");
    }
}
