const { body, param, validationResult } = require('express-validator');

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

// Home validation
exports.validateAddHome = [
  body('name')
    .notEmpty()
    .withMessage('Home name is required')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('plot_number')
    .notEmpty()
    .withMessage('Plot number is required')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Plot number is too long'),
  body('street')
    .notEmpty()
    .withMessage('Street is required')
    .trim(),
  body('contact_email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('contact_phone')
    .optional()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('Invalid phone number format'),
  handleValidationErrors,
];

exports.validateUpdateHome = [
  param('id')
    .isUUID()
    .withMessage('Invalid home ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('plot_number')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Plot number is too long'),
  body('street')
    .optional()
    .trim(),
  body('contact_email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('contact_phone')
    .optional()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('Invalid phone number format'),
  handleValidationErrors,
];

// Resident validation
exports.validateAddResident = [
  body('name')
    .notEmpty()
    .withMessage('Resident name is required')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('Invalid phone number format'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('home_id')
    .notEmpty()
    .withMessage('Home ID is required')
    .isUUID()
    .withMessage('Invalid home ID format'),
  handleValidationErrors,
];

exports.validateUpdateResident = [
  param('id')
    .isUUID()
    .withMessage('Invalid resident ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s-()]+$/)
    .withMessage('Invalid phone number format'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('home_id')
    .optional()
    .isUUID()
    .withMessage('Invalid home ID format'),
  handleValidationErrors,
];

exports.validateResetPassword = [
  param('id')
    .isUUID()
    .withMessage('Invalid resident ID'),
  body('new_password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

// UUID param validation
exports.validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors,
];

