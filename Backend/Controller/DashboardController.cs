using Backend.Models;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly EmployeeRepository _repository;

    public DashboardController(EmployeeRepository repository)
    {
        _repository = repository;
    }

    [HttpGet("summary")]
    public ActionResult<DashboardSummary> GetSummary(
        int? departmentId,
        int? employmentTypeId,
        int? locationId)
    {
        return Ok(_repository.GetDashboardSummary(departmentId, employmentTypeId, locationId));
    }

    [HttpGet("attendance-summary")]
    public ActionResult<AttendanceSummary> GetAttendanceSummary(
        int? departmentId,
        int? employmentTypeId,
        int? locationId)
    {
        return Ok(_repository.GetAttendanceSummary(departmentId, employmentTypeId, locationId));
    }

    [HttpGet("projects-summary")]
    public ActionResult<ProjectsSummary> GetProjectsSummary(
        int? departmentId,
        int? employmentTypeId,
        int? locationId)
    {
        return Ok(_repository.GetProjectsSummary(departmentId, employmentTypeId, locationId));
    }
}
