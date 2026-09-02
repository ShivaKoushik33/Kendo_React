namespace Backend.Models;

public class AttendanceSummary
{
    public decimal AverageAttendance { get; set; }

    public int HighestAttendance { get; set; }

    public int ExcellentCount { get; set; }

    public int LowCount { get; set; }

    public List<DepartmentAttendance> ByDepartment { get; set; } = new();
}
