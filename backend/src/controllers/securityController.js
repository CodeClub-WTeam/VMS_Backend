const validationService = require('../services/validationService');
const { EntryLog, Resident, Home } = require('../models');

// Validate access code
exports.validateCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const securityId = req.user.id;
    
    if (!code || code.length !== 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE_FORMAT',
          message: 'Code must be exactly 5 characters',
        },
      });
    }
    
    // Validate code
    const validationResult = await validationService.validateAccessCode(
      code.toUpperCase()
    );
    
    // Log entry
    await validationService.logEntry(validationResult, securityId);
    
    // Add timestamp
    validationResult.validated_at = new Date().toISOString();
    
    res.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    next(error);
  }
};

// Validate QR code (same logic)
exports.validateQRCode = async (req, res, next) => {
  try {
    const { qr_data } = req.body;
    const securityId = req.user.id;
    
    // QR data is just the 5-char code
    const code = qr_data.toUpperCase();
    
    if (!code || code.length !== 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE_FORMAT',
          message: 'Invalid QR code data',
        },
      });
    }
    
    const validationResult = await validationService.validateAccessCode(code);
    await validationService.logEntry(validationResult, securityId);
    
    validationResult.validated_at = new Date().toISOString();
    
    res.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    next(error);
  }
};

// Get recent validations
exports.getRecentValidations = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const securityId = req.user.id;
    
    const logs = await EntryLog.findAll({
      where: { securityId },
      limit: parseInt(limit),
      order: [['validatedAt', 'DESC']],
      include: [
        {
          model: Resident,
          as: 'resident',
          attributes: ['id', 'name'],
          include: [
            {
              model: Home,
              as: 'home',
              attributes: ['name', 'plotNumber', 'street'],
            },
          ],
        },
      ],
    });
    
    const validations = logs.map((log) => ({
      id: log.id,
      code: log.code,
      result: log.result,
      visitor_name: log.visitorName,
      resident_name: log.resident?.name || 'Unknown',
      home: log.resident?.home
        ? `${log.resident.home.plotNumber}, ${log.resident.home.street}`
        : 'Unknown',
      validated_at: log.validatedAt,
    }));
    
    res.json({
      success: true,
      data: {
        validations,
      },
    });
  } catch (error) {
    next(error);
  }
};

