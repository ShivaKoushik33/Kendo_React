using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class EmailSnapshotDto
{
    // PNG bytes as base64. The "data:image/png;base64," prefix is tolerated and stripped.
    [Required(ErrorMessage = "A snapshot image is required.")]
    public string ImageBase64 { get; set; } = "";

    [StringLength(200, ErrorMessage = "Subject must be 200 characters or fewer.")]
    public string? Subject { get; set; }

    [StringLength(2000, ErrorMessage = "Note must be 2000 characters or fewer.")]
    public string? Note { get; set; }

    [StringLength(100)]
    public string? FileName { get; set; }
}
