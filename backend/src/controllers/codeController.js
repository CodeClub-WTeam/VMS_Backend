const { AccessCode, Resident, Home, EntryLog } = require('../models');
const codeService = require('../services/codeService');
const qrService = require('../services/qrService');
const { Op } = require('sequelize');

// Generate access code
exports.generateCode = async (req, res, next) => {
  try {
    const { visit_date, start_time, end_time, visitor_name } = req.body;
    const residentId = req.user.id;
    
    // Generate unique code
    const code = await codeService.generateUniqueCode(visit_date);
    
    // Generate QR code
    const qrCode = await qrService.generateQRCode(code);
    
    // Get resident info
    const resident = await Resident.findByPk(residentId, {
      include: [{ model: Home, as: 'home' }],
    });
    
    // Create access code
    const accessCode = await AccessCode.create({
      code,
      residentId,
      visitDate: visit_date,
      startTime: start_time,
      endTime: end_time,
      visitorName: visitor_name || null,
      qrCodeData: qrCode,
      status: 'active',
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: accessCode.id,
        code: accessCode.code,
        qr_code: accessCode.qrCodeData,
        visit_date: accessCode.visitDate,
        start_time: accessCode.startTime,
        end_time: accessCode.endTime,
        visitor_name: accessCode.visitorName,
        status: accessCode.status,
        created_at: accessCode.createdAt,
        resident: {
          name: resident.name,
          home: `${resident.home.plotNumber}, ${resident.home.street}`,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get my codes
exports.getMyCodes = async (req, res, next) => {
  try {
    const residentId = req.user.id;
    const { status = 'all', limit = 10, offset = 0 } = req.query;
    
    const where = { residentId };
    if (status !== 'all') {
      where.status = status;
    }
    
    const { count, rows } = await AccessCode.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });
    
    res.json({
      success: true,
      data: {
        codes: rows,
        pagination: {
          total: count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: count > parseInt(offset) + parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get my visit history
exports.getMyHistory = async (req, res, next) => {
  try {
    const residentId = req.user.id;
    const { from_date, to_date, limit = 20, offset = 0 } = req.query;
    
    const where = { residentId, result: 'granted' };
    if (from_date || to_date) {
      where.validatedAt = {};
      if (from_date) where.validatedAt[Op.gte] = new Date(from_date);
      if (to_date) where.validatedAt[Op.lte] = new Date(to_date + 'T23:59:59');
    }
    
    const { count, rows } = await EntryLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['validatedAt', 'DESC']],
      include: [
        {
          model: AccessCode,
          as: 'accessCode',
          attributes: ['visitorName'],
        },
      ],
    });
    
    const entries = rows.map((log) => ({
      id: log.id,
      code: log.code,
      visitor_name: log.accessCode?.visitorName || 'Not provided',
      validated_at: log.validatedAt,
      result: log.result,
      gate: log.gate,
    }));
    
    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          total: count,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cancel code
exports.cancelCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const residentId = req.user.id;
    
    const accessCode = await AccessCode.findOne({
      where: { id, residentId },
    });
    
    if (!accessCode) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CODE_NOT_FOUND',
          message: 'Access code not found',
        },
      });
    }
    
    if (accessCode.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CODE_NOT_ACTIVE',
          message: `Cannot cancel ${accessCode.status} code. Only active codes can be cancelled.`,
        },
      });
    }
    
    await accessCode.update({
      status: 'cancelled',
      cancelledAt: new Date(),
    });
    
    res.json({
      success: true,
      message: 'Access code cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

