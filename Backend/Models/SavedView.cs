namespace Backend.Models;

public class SavedView
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public int? EmploymentTypeId { get; set; }
    public int? LocationId { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
