// Authentication middleware (optional for now)
const validateApiKey = (req, res, next) => {
  // For now, we'll skip authentication
  // In a production environment, you would validate API keys here
  
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  // Skip validation for development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Basic API key validation
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide an API key in the x-api-key header or apiKey query parameter'
    });
  }
  
  // For now, accept any non-empty API key
  // In production, you would validate against a database or service
  if (apiKey.length < 10) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'API key must be at least 10 characters long'
    });
  }
  
  // Add user/client info to request
  req.user = {
    id: 'default-user',
    apiKey: apiKey
  };
  
  next();
};

// Optional authentication middleware
const optionalAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (apiKey) {
    return validateApiKey(req, res, next);
  }
  
  // No API key provided, continue without user info
  req.user = null;
  next();
};

// Role-based access control (placeholder)
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid API key'
      });
    }
    
    // For now, all authenticated users have all roles
    // In production, implement proper role checking
    next();
  };
};

module.exports = {
  validateApiKey,
  optionalAuth,
  requireRole
};
