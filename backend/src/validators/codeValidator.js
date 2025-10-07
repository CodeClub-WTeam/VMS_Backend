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

