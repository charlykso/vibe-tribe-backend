export const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    // Generate request ID
    const requestId = Math.random().toString(36).substring(2, 15);
    req.headers['x-request-id'] = requestId;
    // Log request start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${requestId}`);
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - Request ID: ${requestId}`);
        // Call original end method
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
//# sourceMappingURL=requestLogger.js.map