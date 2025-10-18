// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    message: 'Internal server error',
    status: 500
  };

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation error',
      status: 400,
      details: err.details
    };
  } else if (err.name === 'CastError') {
    error = {
      message: 'Invalid ID format',
      status: 400
    };
  } else if (err.code === 'ENOENT') {
    error = {
      message: 'File not found',
      status: 404
    };
  } else if (err.code === 'EACCES') {
    error = {
      message: 'Permission denied',
      status: 403
    };
  } else if (err.code === 'ENOSPC') {
    error = {
      message: 'Insufficient storage space',
      status: 507
    };
  } else if (err.message) {
    error.message = err.message;
    
    // Handle known error patterns
    if (err.message.includes('not found')) {
      error.status = 404;
    } else if (err.message.includes('already exists')) {
      error.status = 409;
    } else if (err.message.includes('invalid') || err.message.includes('malformed')) {
      error.status = 400;
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Something went wrong';
  }

  res.status(error.status).json({
    error: error.message,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      timestamp: new Date().toISOString()
    })
  });
};

// 404 handler for unknown routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper to catch async errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
