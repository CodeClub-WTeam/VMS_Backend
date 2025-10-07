module.exports = (err, req, res, next) => {
  // Log error in development only
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }
  
  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map((e) => ({ 
          field: e.path, 
          message: e.message 
        })),
      },
    });
  }
  
  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this value already exists',
        details: err.errors.map((e) => ({ 
          field: e.path, 
          message: e.message 
        })),
      },
    });
  }
  
  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Referenced record does not exist',
      },
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid token',
      },
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      },
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
};

