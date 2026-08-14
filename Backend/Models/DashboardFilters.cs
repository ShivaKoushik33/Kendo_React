namespace Backend.Models;

public class DashboardFilters
{
    public List<FilterOption> Departments { get; set; } = new();

    public List<FilterOption> Locations { get; set; } = new();

    public List<FilterOption> EmploymentTypes { get; set; } = new();

    public List<FilterOption> Skills { get; set; } = new();
}