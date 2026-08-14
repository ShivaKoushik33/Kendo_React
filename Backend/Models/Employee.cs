namespace Backend.Models;

public class Employee
{
    public int Id { get; set; }

    public string EmployeeCode { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string EmploymentType { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public int Attendance { get; set; }

    public decimal Performance { get; set; }

    public int ActiveProjects { get; set; }

    public int ExperienceYears { get; set; }

    public decimal Salary { get; set; }
 
    public int JoiningYear { get; set; }

    public bool IsActive { get; set; }
    public int DepartmentId { get; set; }

    public int EmploymentTypeId { get; set; }

    public int LocationId { get; set; }
}