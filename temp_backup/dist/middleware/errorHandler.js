export class ValidationError extends Error {
    details;
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    isOperational = true;
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'ValidationError';
    }
}
export class BadRequestError extends Error {
    statusCode = 400;
    code = 'BAD_REQUEST';
    isOperational = true;
    constructor(message = 'Bad request') {
        super(message);
        this.name = 'BadRequestError';
    }
}
export class NotFoundError extends Error {
    statusCode = 404;
    code = 'NOT_FOUND';
    isOperational = true;
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}
export class UnauthorizedError extends Error {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    isOperational = true;
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
export class ForbiddenError extends Error {
    statusCode = 403;
    code = 'FORBIDDEN';
    isOperational = true;
    constructor(message = 'Access forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}
export class ConflictError extends Error {
    statusCode = 409;
    code = 'CONFLICT';
    isOperational = true;
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
    }
}
export class RateLimitError extends Error {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
    isOperational = true;
    constructor(message = 'Rate limit exceeded') {
        super(message);
        this.name = 'RateLimitError';
    }
}
export const errorHandler = (error, req, res, next) => {
    // Log error details
    console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    // Default error values
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    let code = error.code || 'INTERNAL_ERROR';
    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'Invalid ID format';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Invalid authentication token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Authentication token expired';
    }
    else if (error.name === 'MulterError') {
        statusCode = 400;
        code = 'FILE_UPLOAD_ERROR';
        message = 'File upload error: ' + error.message;
    }
    // Prepare error response
    const errorResponse = {
        error: message,
        code,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };
    // Add additional details in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        if (error.details) {
            errorResponse.details = error.details;
        }
    }
    // Add request ID if available
    if (req.headers['x-request-id']) {
        errorResponse.requestId = req.headers['x-request-id'];
    }
    res.status(statusCode).json(errorResponse);
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
export const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
    next(error);
};
//# sourceMappingURL=errorHandler.js.map