using Backend.DTOs;
using Backend.Interfaces;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Net;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmailController : ControllerBase
{
    // Base64 inflates by ~33%, so an 8 MB image arrives as ~11 MB of JSON. Most
    // mail servers reject messages past 10-25 MB anyway, so stop it here.
    private const int MaxImageBytes = 8 * 1024 * 1024;

    private readonly IEmailService _emailService;
    private readonly SmtpSettings _settings;
    private readonly ILogger<EmailController> _logger;

    public EmailController(IEmailService emailService, IOptions<SmtpSettings> settings, ILogger<EmailController> logger)
    {
        _emailService = emailService;
        _settings = settings.Value;
        _logger = logger;
    }

    // M0: proves the SMTP leg works before any UI exists. Hit it from Swagger.
    [HttpPost("test")]
    public async Task<IActionResult> SendTest(CancellationToken cancellationToken)
    {
        using var _ = _logger.TraceMethod();

        await _emailService.SendAsync(new EmailMessage
        {
            Subject = "Test email from the Employee Dashboard backend",
            TextBody = "If you are reading this, SMTP is configured correctly.",
            HtmlBody = "<p style=\"font-family:Arial,sans-serif;font-size:14px\">If you are reading this, SMTP is configured correctly.</p>"
        }, cancellationToken);

        return Ok($"Test email sent to {_settings.To}.");
    }

    [HttpPost("snapshot")]
    public async Task<IActionResult> SendSnapshot(EmailSnapshotDto dto, CancellationToken cancellationToken)
    {
        using var _ = _logger.TraceMethod();

        // The client may send either a bare base64 payload or a full data URL.
        string payload = dto.ImageBase64;
        int comma = payload.IndexOf(',');
        if (payload.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && comma > 0)
        {
            payload = payload[(comma + 1)..];
        }

        byte[] image;
        try
        {
            image = Convert.FromBase64String(payload);
        }
        catch (FormatException)
        {
            _logger.LogWarning("Snapshot email rejected: image payload was not valid base64");
            return BadRequest("Snapshot image was not valid base64.");
        }

        if (image.Length == 0)
        {
            return BadRequest("Snapshot image was empty.");
        }

        if (image.Length > MaxImageBytes)
        {
            _logger.LogWarning("Snapshot email rejected: image was {Bytes} bytes", image.Length);
            return BadRequest($"Snapshot image is {image.Length / (1024 * 1024)} MB; the limit is {MaxImageBytes / (1024 * 1024)} MB.");
        }

        string subject = string.IsNullOrWhiteSpace(dto.Subject) ? "Dashboard snapshot" : dto.Subject.Trim();
        string fileName = string.IsNullOrWhiteSpace(dto.FileName) ? "dashboard.png" : dto.FileName.Trim();
        const string contentId = "dashboard-snapshot";

        await _emailService.SendAsync(new EmailMessage
        {
            Subject = subject,
            TextBody = BuildTextBody(dto.Note),
            HtmlBody = BuildHtmlBody(subject, dto.Note, contentId),
            Attachments =
            {
                new EmailAttachment
                {
                    FileName = fileName,
                    ContentType = "image/png",
                    Content = image,
                    ContentId = contentId
                }
            }
        }, cancellationToken);

        return Ok($"Snapshot emailed to {_settings.To}.");
    }

    private static string BuildTextBody(string? note)
    {
        string body = "A dashboard snapshot is attached.";
        return string.IsNullOrWhiteSpace(note) ? body : note.Trim() + "\n\n" + body;
    }

    // Outlook renders mail with the Word engine: no flex, no grid, and Gmail web
    // strips <style> blocks - so every rule has to sit inline on the element.
    private static string BuildHtmlBody(string subject, string? note, string contentId)
    {
        string noteHtml = string.IsNullOrWhiteSpace(note)
            ? ""
            : $"<p style=\"margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#333\">{WebUtility.HtmlEncode(note.Trim())}</p>";

        return $@"<table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""background:#f5f5f5;padding:24px"">
  <tr>
    <td align=""center"">
      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""720"" style=""background:#ffffff;border:1px solid #e0e0e0;border-radius:6px;padding:24px"">
        <tr>
          <td>
            <h2 style=""margin:0 0 16px;font-family:Arial,sans-serif;font-size:20px;color:#111"">{WebUtility.HtmlEncode(subject)}</h2>
            {noteHtml}
            <img src=""cid:{contentId}"" alt=""Dashboard snapshot"" width=""672"" style=""display:block;width:100%;max-width:672px;height:auto;border:1px solid #e0e0e0"" />
            <p style=""margin:16px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#888"">Sent from the Employee Dashboard.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>";
    }
}
