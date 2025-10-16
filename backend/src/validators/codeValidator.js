const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.mapped(),
      },
    });
  }
  next();
};

exports.validateCodeGeneration = [
  body('visit_date')
    .notEmpty()
    .withMessage('Visit date is required')
    .isDate()
    .withMessage('Invalid date format (use YYYY-MM-DD)')
    .custom((value) => {
      const today = new Date().toISOString().split('T')[0];
      if (value < today) {
        throw new Error('Visit date cannot be in the past');
      }
      return true;
    }),
  body('start_time')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Invalid time format (use HH:MM in 24-hour format)'),
  body('end_time')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Invalid time format (use HH:MM in 24-hour format)')
    .custom((value, { req }) => {
      if (value <= req.body.start_time) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('visitor_name')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Visitor name is too long (max 255 characters)')
    .trim(),
  handleValidationErrors,
];

exports.validatePasswordChange = [
  body('old_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .custom((value, { req }) => {
      if (value === req.body.old_password) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  handleValidationErrors,
];

exports.validateProfileUpdate = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Invalid phone number format'),
  body('profile_picture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),
  body('email')
    .custom((value) => {
      if (value !== undefined) {
        throw new Error('Email cannot be changed');
      }
      return true;
    }),
  body('home_id')
    .custom((value) => {
      if (value !== undefined) {
        throw new Error('Home cannot be changed by resident');
      }
      return true;
    }),
  body('role')
    .custom((value) => {
      if (value !== undefined) {
        throw new Error('Role cannot be changed');
      }
      return true;
    }),
  body('status')
    .custom((value) => {
      if (value !== undefined) {
        throw new Error('Status cannot be changed by resident');
      }
      return true;
    }),
  handleValidationErrors,
];

