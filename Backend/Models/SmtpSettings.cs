namespace Backend.Models;

public class SmtpSettings
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;

    // Gmail and Outlook both want STARTTLS on 587. Set false only for a local
    // catcher like smtp4dev, which listens in the clear on 25.
    public bool UseStartTls { get; set; } = true;

    public string From { get; set; } = "";
    public string FromName { get; set; } = "";

    // The fixed recipient. Requests may not override this - see EmailController.
    public string To { get; set; } = "";

    // Leave User blank to skip the AUTH step entirely (smtp4dev needs no login).
    public string User { get; set; } = "";

    // Never in appsettings.json - that file is tracked by git.
    // Set with: dotnet user-secrets set "Smtp:Password" "<16-char app password>"
    public string Password { get; set; } = "";
}
