using Backend.Repositories;
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
        _logger.LogInformation("Get Employees method started");
        var employees = _repository.GetEmployees();

        return Ok(employees);
    }

    [HttpGet("{id}")]
public IActionResult GetEmployeeById(int id)
{
    try
    {
         _logger.LogInformation($"Get Employee with Id :  {id} method started");
        var employee = _repository.GetEmployeeById(id);

        if (employee == null)
        {
            _logger.LogWarning($"Employee with {id} Not found bete");
            return NotFound($"Employee with {id} Not found bete");
        }
        return Ok(employee);
    }
    catch (Exception ex)
    {
        return StatusCode(500, ex.Message);
    }
}

[HttpPost]
public IActionResult AddEmployee(Employee employee)
{
    try
    {
        bool result = _repository.AddEmployee(employee);

        if (result)
            return Ok("Employee Added Successfully");

        return BadRequest("Unable to Add Employee");
    }
    catch (Exception ex)
    {
        return StatusCode(500, ex.Message);
    }
}


[HttpPut("{id}")]
public IActionResult UpdateEmployee(int id, Employee employee)
{
    try
    {
        employee.Id = id;

        bool result = _repository.UpdateEmployee(employee);

        if (result)
            return Ok("Employee Updated Successfully");

        return NotFound("Employee Not Found");
    }
    catch (Exception ex)
    {
        return StatusCode(500, ex.Message);
    }
}



[HttpDelete("{id}")]
public IActionResult DeleteEmployee(int id)
{
    try
    {
        bool result = _repository.DeleteEmployee(id);
        if (result)
            return Ok("Employee Deleted Successfully");
        return NotFound("Employee Not Found");
    }
    catch (Exception ex)
    {
        return StatusCode(500, ex.Message);
    }
}


}