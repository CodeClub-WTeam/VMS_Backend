const { body, param } = require('express-validator');

/**
 * Validate send invitation request
 */
exports.validateSendInvitation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('role')
    .isIn(['superadmin', 'estate_manager', 'security', 'resident'])
    .withMessage('Invalid role. Must be one of: superadmin, estate_manager, security, resident'),
  
  body('estate_id')
    .optional()
    .isUUID()
    .withMessage('Estate ID must be a valid UUID'),
  
  body('home_id')
    .optional()
    .isUUID()
    .withMessage('Home ID must be a valid UUID'),
];

/**
 * Validate accept invitation request
 */
exports.validateAcceptInvitation = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Invitation token is required'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone must be between 10 and 20 characters'),
  
  body('profilePicture')
    .optional({ checkFalsy: true })
    .trim(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

/**
 * Validate invitation token parameter
 */
exports.validateInvitationToken = [
  param('token')
    .trim()
    .notEmpty()
    .withMessage('Invitation token is required'),
];

/**
 * Validate invitation ID parameter
 */
exports.validateInvitationId = [
  param('id')
    .isUUID()
    .withMessage('Invitation ID must be a valid UUID'),
];

