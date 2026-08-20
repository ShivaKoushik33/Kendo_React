using System.Diagnostics;
using System.Runtime.CompilerServices;

namespace Backend.Services;

public static class MethodTraceExtensions
{
    public static IDisposable TraceMethod(this ILogger logger, [CallerMemberName] string method = "")
    {
        return new MethodTrace(logger, method);
    }

    private sealed class MethodTrace : IDisposable
    {
        private readonly ILogger _logger;
        private readonly string _method;
        private readonly long _startedAt;

        public MethodTrace(ILogger logger, string method)
        {
            _logger = logger;
            _method = method;
            _startedAt = Stopwatch.GetTimestamp();
            _logger.LogInformation("{Method} started", method);
        }

        public void Dispose()
        {
            _logger.LogInformation(
                "{Method} ended in {ElapsedMs:0.##} ms",
                _method,
                Stopwatch.GetElapsedTime(_startedAt).TotalMilliseconds);
        }
    }
}
