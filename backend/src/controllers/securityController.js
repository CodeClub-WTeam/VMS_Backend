const validationService = require('../services/validationService');
const { EntryLog, Resident, Home } = require('../models');

// Validate access code
exports.validateCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const securityId = req.user.id;
    
    console.log('=== VALIDATE CODE REQUEST ===');
    console.log('Security ID:', securityId);
    console.log('Code to validate:', code);
    
    if (!code || code.length !== 5) {
      console.log('Invalid code format');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE_FORMAT',
          message: 'Code must be exactly 5 characters',
        },
      });
    }
    
    // Validate code
    console.log('Calling validation service...');
    const validationResult = await validationService.validateAccessCode(
      code.toUpperCase()
    );
    console.log('Validation result:', validationResult.result);
    
    // Log entry
    console.log('Logging entry...');
    await validationService.logEntry(validationResult, securityId);
    
    // Add timestamp
    validationResult.validated_at = new Date().toISOString();
    
    console.log('=== VALIDATION COMPLETED ===\n');
    
    res.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    console.error('=== ERROR IN VALIDATE CODE ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Security ID:', req.user?.id);
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error('SQL Error:', error.original?.message);
      console.error('SQL Query:', error.sql);
    }
    
    console.error('=== END ERROR LOG ===\n');
    next(error);
  }
};

// Validate QR code (same logic)
exports.validateQRCode = async (req, res, next) => {
  try {
    const { qr_data } = req.body;
    const securityId = req.user.id;
    
    console.log('=== VALIDATE QR CODE REQUEST ===');
    console.log('Security ID:', securityId);
    console.log('QR data:', qr_data);
    
    // QR data is just the 5-char code
    const code = qr_data.toUpperCase();
    
    if (!code || code.length !== 5) {
      console.log('Invalid QR code format');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE_FORMAT',
          message: 'Invalid QR code data',
        },
      });
    }
    
    console.log('Calling validation service...');
    const validationResult = await validationService.validateAccessCode(code);
    console.log('Validation result:', validationResult.result);
    
    console.log('Logging entry...');
    await validationService.logEntry(validationResult, securityId);
    
    validationResult.validated_at = new Date().toISOString();
    
    console.log('=== QR VALIDATION COMPLETED ===\n');
    
    res.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    console.error('=== ERROR IN VALIDATE QR CODE ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Security ID:', req.user?.id);
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error('SQL Error:', error.original?.message);
      console.error('SQL Query:', error.sql);
    }
    
    console.error('=== END ERROR LOG ===\n');
    next(error);
  }
};

// Get recent validations
exports.getRecentValidations = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const securityId = req.user.id;
    
    console.log('=== GET RECENT VALIDATIONS REQUEST ===');
    console.log('Security ID:', securityId);
    console.log('Limit:', limit);
    
    const logs = await EntryLog.findAll({
      where: { securityId },
      limit: parseInt(limit) || 50,  // Default to 50 if NaN
      order: [['validatedAt', 'DESC']],
      include: [
        {
          model: Resident,
          as: 'resident',
          attributes: ['id', 'firstName', 'lastName'],
          required: false, // LEFT JOIN
          include: [
            {
              model: Home,
              as: 'home',
              attributes: ['name', 'plotNumber', 'street'],
              required: false, // LEFT JOIN
            },
          ],
        },
      ],
    });
    
    console.log('Query successful! Found', logs.length, 'logs');
    
    const validations = logs.map((log) => ({
      id: log.id,
      code: log.code,
      result: log.result,
      visitor_name: log.visitorName,
      resident_name: log.resident 
        ? `${log.resident.firstName} ${log.resident.lastName}` 
        : 'Unknown',
      home: log.resident?.home
        ? `${log.resident.home.plotNumber}, ${log.resident.home.street}`
        : 'Unknown',
      validated_at: log.validatedAt,
    }));
    
    console.log('=== REQUEST COMPLETED ===\n');
    
    res.json({
      success: true,
      data: {
        validations,
      },
    });
  } catch (error) {
    console.error('=== ERROR IN GET RECENT VALIDATIONS ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Security ID:', req.user?.id);
    console.error('Limit:', req.query.limit);
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error('SQL Error:', error.original?.message);
      console.error('SQL Query:', error.sql);
    }
    
    console.error('=== END ERROR LOG ===\n');
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          name: error.name,
          stack: error.stack,
          sql: error.sql,
        } : undefined,
      },
    });
  }
};

