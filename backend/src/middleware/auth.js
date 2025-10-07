const { verifyToken } = require('../config/auth');

exports.verifyToken = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MISSING',
          message: 'No token provided. Please include Authorization header with Bearer token.',
        },
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      estateId: decoded.estateId,
      homeId: decoded.homeId,
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please login again.',
        },
      });
    }
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid token provided.',
      },
    });
  }
};

