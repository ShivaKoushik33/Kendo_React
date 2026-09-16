using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class SavedViewDto
{
    [Required(ErrorMessage = "View name is required.")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "View name must be 1-100 characters.")]
    public string Name { get; set; } = "";

    public int? DepartmentId { get; set; }
    public int? EmploymentTypeId { get; set; }
    public int? LocationId { get; set; }
    public bool IsDefault { get; set; }
}
