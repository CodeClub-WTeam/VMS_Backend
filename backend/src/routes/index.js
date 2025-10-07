const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const codeRoutes = require('./codes');
const securityRoutes = require('./security');
const adminRoutes = require('./admin');
const invitationRoutes = require('./invitations');
const systemRoutes = require('./system');

// Mount routes
router.use('/auth', authRoutes);
router.use('/codes', codeRoutes);
router.use('/security', securityRoutes);
router.use('/admin', adminRoutes);
router.use('/invitations', invitationRoutes);
router.use('/system', systemRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'VMS API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      codes: '/api/v1/codes',
      security: '/api/v1/security',
      admin: '/api/v1/admin',
      invitations: '/api/v1/invitations',
      system: '/api/v1/system',
    },
    documentation: '/api-docs',
  });
});

module.exports = router;

