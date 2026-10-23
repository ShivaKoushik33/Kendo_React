namespace Backend.Models;

public class EmailAttachment
{
    public string FileName { get; set; } = "";
    public string ContentType { get; set; } = "application/octet-stream";
    public byte[] Content { get; set; } = Array.Empty<byte>();

    // When set, the part is embedded in the HTML body as <img src="cid:{ContentId}">
    // instead of riding along as a separate download.
    public string? ContentId { get; set; }
}

// Deliberately knows nothing about grids, employees or screenshots. Whatever
// builds the content hands over one of these, so a second caller costs nothing.
public class EmailMessage
{
    public string? To { get; set; }
    public string Subject { get; set; } = "";
    public string HtmlBody { get; set; } = "";
    public string TextBody { get; set; } = "";
    public List<EmailAttachment> Attachments { get; set; } = new();
}
