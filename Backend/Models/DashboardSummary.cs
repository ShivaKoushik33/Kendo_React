namespace Backend.Models;

public class DashboardSummary
{
    public int TotalEmployees { get; set; }
    public int ActiveEmployees { get; set; }
    public decimal AverageAttendance { get; set; }
    public decimal AveragePerformance { get; set; }
}
