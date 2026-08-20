using System.Security.Claims;
using Serilog.Context;
namespace Backend.Middleware;


public class RequestContextMiddleware
{
    private readonly RequestDelegate _next;

    public RequestContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var userName =
            context.User.FindFirst(ClaimTypes.Email)?.Value
            ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? "Anonymous";

        using (LogContext.PushProperty("UserName", userName))
        using (LogContext.PushProperty("CorrelationId", context.TraceIdentifier))
        {
            await _next(context);
        }
    }
}
