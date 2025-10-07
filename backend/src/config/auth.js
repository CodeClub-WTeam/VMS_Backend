const jwt = require('jsonwebtoken');

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  generateToken: (payload) => {
    return jwt.sign(payload, module.exports.jwtSecret, {
      expiresIn: module.exports.jwtExpiresIn,
    });
  },
  
  verifyToken: (token) => {
    return jwt.verify(token, module.exports.jwtSecret);
  },
};

