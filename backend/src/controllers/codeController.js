const { AccessCode, Resident, Home, EntryLog } = require('../models');
const codeService = require('../services/codeService');
const qrService = require('../services/qrService');
const { Op } = require('sequelize');

// Generate access code
exports.generateCode = async (req, res, next) => {
  try {
    const { visit_date, start_time, end_time, visitor_name } = req.body;
    const residentId = req.user.id;
    
    console.log('=== GENERATE CODE REQUEST ===');
    console.log('Resident ID:', residentId);
    console.log('Request body:', { visit_date, start_time, end_time, visitor_name });
    
    // Generate unique code
    const code = await codeService.generateUniqueCode(visit_date);
    console.log('Generated code:', code);
    
    // Generate QR code
    const qrCode = await qrService.generateQRCode(code);
    console.log('QR code generated, length:', qrCode?.length);
    
    // Get resident info
    const resident = await Resident.findByPk(residentId, {
      include: [{ model: Home, as: 'home' }],
    });
    
    if (!resident) {
      console.error('Resident not found:', residentId);
      return res.status(404).json({
        success: false,
        error: { code: 'RESIDENT_NOT_FOUND', message: 'Resident not found' },
      });
    }
    
    console.log('Resident found:', resident.firstName, resident.lastName);
    console.log('Home:', resident.home?.plotNumber);
    
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
    
    console.log('Access code created successfully:', accessCode.id);
    console.log('=== REQUEST COMPLETED ===\n');
    
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
          name: `${resident.firstName} ${resident.lastName}`,
          home: `${resident.home.plotNumber}, ${resident.home.street}`,
        },
      },
    });
  } catch (error) {
    console.error('=== ERROR IN GENERATE CODE ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('=== END ERROR LOG ===\n');
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
    
    const parsedLimit = parseInt(limit) || 10;
    const parsedOffset = parseInt(offset) || 0;
    
    const { count, rows } = await AccessCode.findAndCountAll({
      where,
      limit: parsedLimit,
      offset: parsedOffset,
      order: [['createdAt', 'DESC']],
    });
    
    res.json({
      success: true,
      data: {
        codes: rows,
        pagination: {
          total: count,
          limit: parsedLimit,
          offset: parsedOffset,
          has_more: count > parsedOffset + parsedLimit,
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
    
    // LOG INPUT PARAMETERS
    console.log('=== GET MY HISTORY REQUEST ===');
    console.log('Resident ID:', residentId);
    console.log('from_date:', from_date, typeof from_date);
    console.log('to_date:', to_date, typeof to_date);
    console.log('limit:', limit, typeof limit);
    console.log('offset:', offset, typeof offset);
    
    const where = { residentId, result: 'granted' };
    if (from_date || to_date) {
      where.validatedAt = {};
      if (from_date) {
        where.validatedAt[Op.gte] = new Date(from_date);
        console.log('from_date converted to:', where.validatedAt[Op.gte]);
      }
      if (to_date) {
        where.validatedAt[Op.lte] = new Date(to_date + 'T23:59:59');
        console.log('to_date converted to:', where.validatedAt[Op.lte]);
      }
    }
    
    // LOG WHERE CLAUSE
    console.log('WHERE clause:', JSON.stringify(where, null, 2));
    
    const { count, rows } = await EntryLog.findAndCountAll({
      where,
      limit: parseInt(limit) || 20,   // Default to 20 if NaN
      offset: parseInt(offset) || 0,  // Default to 0 if NaN
      order: [['validatedAt', 'DESC']],
      include: [
        {
          model: AccessCode,
          as: 'accessCode',
          attributes: ['id', 'visitorName'],
          required: false, // Make join optional (LEFT JOIN instead of INNER JOIN)
        },
      ],
    });
    
    console.log('Query successful! Found', count, 'entries');
    
    const parsedLimit = parseInt(limit) || 20;
    const parsedOffset = parseInt(offset) || 0;
    
    const entries = rows.map((log) => ({
      id: log.id,
      code: log.code,
      visitor_name: log.accessCode?.visitorName || 'Not provided',
      validated_at: log.validatedAt,
      result: log.result,
      gate: log.gate,
    }));
    
    console.log('=== REQUEST COMPLETED ===\n');
    
    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          total: count,
          limit: parsedLimit,
          offset: parsedOffset,
        },
      },
    });
  } catch (error) {
    // COMPREHENSIVE ERROR LOGGING
    console.error('=== ERROR IN GET MY HISTORY ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request params:', {
      residentId: req.user?.id,
      from_date: req.query.from_date,
      to_date: req.query.to_date,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    
    // Check if it's a Sequelize error
    if (error.name === 'SequelizeDatabaseError') {
      console.error('SQL Error:', error.original?.message);
      console.error('SQL Query:', error.sql);
    }
    
    console.error('=== END ERROR LOG ===\n');
    
    // Return detailed error to frontend
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

// Change own password
exports.changePassword = async (req, res, next) => {
  try {
    const residentId = req.user.id;
    const { old_password, new_password } = req.body;
    
    console.log('=== CHANGE PASSWORD REQUEST ===');
    console.log('Resident ID:', residentId);
    
    // Get resident
    const resident = await Resident.findByPk(residentId);
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'Resident not found',
        },
      });
    }
    
    // Verify old password
    const isValidPassword = await resident.comparePassword(old_password);
    
    if (!isValidPassword) {
      console.log('Old password incorrect');
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect',
        },
      });
    }
    
    // Update password (will be auto-hashed by model hook)
    await resident.update({ passwordHash: new_password });
    
    console.log('Password changed successfully');
    console.log('=== REQUEST COMPLETED ===\n');
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('=== ERROR IN CHANGE PASSWORD ===');
    console.error('Error:', error.message);
    console.error('=== END ERROR LOG ===\n');
    next(error);
  }
};

// Update own profile
exports.updateProfile = async (req, res, next) => {
  try {
    const residentId = req.user.id;
    const { first_name, last_name, phone, profile_picture } = req.body;
    
    console.log('=== UPDATE PROFILE REQUEST ===');
    console.log('Resident ID:', residentId);
    console.log('Updates:', { first_name, last_name, phone, profile_picture });
    
    // Get resident
    const resident = await Resident.findByPk(residentId, {
      include: [{ model: Home, as: 'home' }],
    });
    
    if (!resident) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'Resident not found',
        },
      });
    }
    
    // Update allowed fields only
    const updates = {};
    if (first_name !== undefined) updates.firstName = first_name;
    if (last_name !== undefined) updates.lastName = last_name;
    if (phone !== undefined) updates.phone = phone;
    if (profile_picture !== undefined) updates.profilePicture = profile_picture;
    
    await resident.update(updates);
    
    console.log('Profile updated successfully');
    console.log('=== REQUEST COMPLETED ===\n');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        resident: resident.toJSON(),
      },
    });
  } catch (error) {
    console.error('=== ERROR IN UPDATE PROFILE ===');
    console.error('Error:', error.message);
    console.error('=== END ERROR LOG ===\n');
    next(error);
  }
};

// Get all my codes (not just validated - combines generated codes)
exports.getAllMyCodes = async (req, res, next) => {
  try {
    const residentId = req.user.id;
    const { from_date, to_date, status = 'all', limit = 50, offset = 0 } = req.query;
    
    console.log('=== GET ALL MY CODES REQUEST ===');
    console.log('Resident ID:', residentId);
    console.log('Filters:', { from_date, to_date, status, limit, offset });
    
    const where = { residentId };
    
    // Filter by status
    if (status !== 'all') {
      where.status = status;
    }
    
    // Filter by date range
    if (from_date || to_date) {
      where.visitDate = {};
      if (from_date) where.visitDate[Op.gte] = from_date;
      if (to_date) where.visitDate[Op.lte] = to_date;
    }
    
    const parsedLimit = parseInt(limit) || 50;
    const parsedOffset = parseInt(offset) || 0;
    
    const { count, rows } = await AccessCode.findAndCountAll({
      where,
      limit: parsedLimit,
      offset: parsedOffset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: EntryLog,
          as: 'entryLogs',
          required: false,
          limit: 1,
          order: [['validatedAt', 'DESC']],
        },
      ],
    });
    
    const codes = rows.map((code) => {
      // Calculate expiry timestamp
      const expiresAt = new Date(`${code.visitDate}T${code.endTime}`);
      
      return {
        id: code.id,
        code: code.code,
        visit_date: code.visitDate,
        start_time: code.startTime,
        end_time: code.endTime,
        visitor_name: code.visitorName,
        status: code.status,
        created_at: code.createdAt,
        expires_at: expiresAt.toISOString(),
        validated_at: code.entryLogs?.[0]?.validatedAt || null,
        validation_result: code.entryLogs?.[0]?.result || null,
      };
    });
    
    console.log('Found', count, 'codes');
    console.log('=== REQUEST COMPLETED ===\n');
    
    res.json({
      success: true,
      data: {
        codes,
        pagination: {
          total: count,
          limit: parsedLimit,
          offset: parsedOffset,
        },
      },
    });
  } catch (error) {
    console.error('=== ERROR IN GET ALL MY CODES ===');
    console.error('Error:', error.message);
    console.error('=== END ERROR LOG ===\n');
    next(error);
  }
};

