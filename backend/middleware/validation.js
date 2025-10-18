// Validation middleware using Joi
const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => ({
          message: detail.message,
          path: detail.path,
          type: detail.type
        }))
      });
    }
    
    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Query validation error',
        details: error.details.map(detail => ({
          message: detail.message,
          path: detail.path,
          type: detail.type
        }))
      });
    }
    
    req.query = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        error: 'Parameter validation error',
        details: error.details.map(detail => ({
          message: detail.message,
          path: detail.path,
          type: detail.type
        }))
      });
    }
    
    req.params = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  id: Joi.string().uuid().required(),
  search: Joi.string().min(1).max(100).required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('created', 'updated', 'name').default('updated'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  schemas
};
