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
    public IActionResult GetEmployeesPaginated(int offset = 0, int size = 10, int? departmentId = null, int? employmentTypeId = null, int? locationId = null, string? sortField = null, string? sortDirection = null)
    {
        if (offset < 0 || size < 1)
        {
            return BadRequest("offset must be non-negative and size must be positive");
        }

        var result = _repository.GetEmployeesPaginated(offset, size, departmentId, employmentTypeId, locationId, sortField, sortDirection);
        _logger.LogInformation("Fetched {Count} employees from page {Page} with total {Total}", result.Items.Count, offset, result.Total);
        return Ok(new { data = result.Items, total = result.Total });
    }

    [HttpGet("top-contributors")]
    public IActionResult GetTopContributors(int offset = 0, int size = 10, int? departmentId = null, int? employmentTypeId = null, int? locationId = null)
    {
        if (offset < 0 || size < 1)
        {
            return BadRequest("offset must be non-negative and size must be positive");
        }

        var result = _repository.GetTopContributors(offset, size, departmentId, employmentTypeId, locationId);
        _logger.LogInformation("Fetched {Count} top contributors from page {Page} with total {Total}", result.Items.Count, offset, result.Total);
        return Ok(new { data = result.Items, total = result.Total });
    }

    [HttpGet("export/excel")]
    public IActionResult ExportEmployeesToExcel(int? departmentId = null, int? employmentTypeId = null, int? locationId = null, string? sortField = null, string? sortDirection = null)
    {
        using var _ = _logger.TraceMethod();

        var workbook = _repository.ExportEmployeesToExcel(departmentId, employmentTypeId, locationId, sortField: sortField, sortDirection: sortDirection);
        return File(workbook, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Employees.xlsx");
    }

    [HttpGet("export/excel/page")]
    public IActionResult ExportPaginatedEmployeesToExcel(int offset = 0, int size = 10, string? sortField = null, string? sortDirection = null)
    {
        using var _ = _logger.TraceMethod();

        if (offset < 0 || size < 1)
        {
            return BadRequest("offset must be non-negative and size must be positive");
        }

        var workbook = _repository.ExportEmployeesToExcel(offset: offset, size: size, sortField: sortField, sortDirection: sortDirection);
        return File(workbook, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Employees.xlsx");
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
