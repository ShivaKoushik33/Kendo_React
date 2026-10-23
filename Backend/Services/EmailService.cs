using Backend.Interfaces;
using Backend.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Backend.Services;

public class EmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<SmtpSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        using var _ = _logger.TraceMethod();

        string recipient = string.IsNullOrWhiteSpace(message.To) ? _settings.To : message.To;

        if (string.IsNullOrWhiteSpace(_settings.Host) || string.IsNullOrWhiteSpace(_settings.From) || string.IsNullOrWhiteSpace(recipient))
        {
            throw new InvalidOperationException("Smtp:Host, Smtp:From and Smtp:To must all be configured.");
        }

        var mime = new MimeMessage();
        mime.From.Add(new MailboxAddress(_settings.FromName, _settings.From));
        mime.To.Add(MailboxAddress.Parse(recipient));
        mime.Subject = message.Subject;

        var builder = new BodyBuilder
        {
            HtmlBody = message.HtmlBody,
            // Plain-text clients and spam filters both want this to exist.
            TextBody = message.TextBody
        };

        foreach (var attachment in message.Attachments)
        {
            var contentType = ContentType.Parse(attachment.ContentType);

            if (string.IsNullOrWhiteSpace(attachment.ContentId))
            {
                builder.Attachments.Add(attachment.FileName, attachment.Content, contentType);
                continue;
            }

            var resource = builder.LinkedResources.Add(attachment.FileName, attachment.Content, contentType);
            resource.ContentId = attachment.ContentId;
        }

        mime.Body = builder.ToMessageBody();

        using var client = new SmtpClient();

        await client.ConnectAsync(
            _settings.Host,
            _settings.Port,
            _settings.UseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.None,
            cancellationToken);

        // A blank user means an unauthenticated relay (smtp4dev); Gmail always needs this.
        if (!string.IsNullOrWhiteSpace(_settings.User))
        {
            await client.AuthenticateAsync(_settings.User, _settings.Password, cancellationToken);
        }

        await client.SendAsync(mime, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        _logger.LogInformation(
            "Email '{Subject}' sent to {Recipient} with {AttachmentCount} attachment(s)",
            message.Subject,
            recipient,
            message.Attachments.Count);
    }
}
