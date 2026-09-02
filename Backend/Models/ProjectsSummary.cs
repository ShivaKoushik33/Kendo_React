namespace Backend.Models;

public class ProjectsSummary
{
    public int TotalProjects { get; set; }

    public decimal AverageProjects { get; set; }

    public int ActiveEmployees { get; set; }

    public int HighestProjects { get; set; }

    public List<DepartmentProjectLoad> ByDepartment { get; set; } = new();
}
