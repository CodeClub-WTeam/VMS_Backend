const { AccessCode, Resident, Home, EntryLog } = require('../models');
const { Op } = require('sequelize');

exports.validateAccessCode = async (code) => {
  // Find access code
  const accessCode = await AccessCode.findOne({
    where: { code },
    include: [
      {
        model: Resident,
        as: 'resident',
        include: [{ model: Home, as: 'home' }],
      },
    ],
  });
  
  // Check if code exists
  if (!accessCode) {
    return {
      result: 'denied',
      reason: 'Access code not found',
      reason_code: 'CODE_NOT_FOUND',
      code,  // Include the attempted code
    };
  }
  
  // Check if cancelled
  if (accessCode.status === 'cancelled') {
    return {
      result: 'denied',
      reason: 'Access code has been cancelled by resident',
      reason_code: 'CODE_CANCELLED',
      code: accessCode.code,
      accessCodeId: accessCode.id,
      residentId: accessCode.residentId,
    };
  }
  
  // Check date
  const today = new Date().toISOString().split('T')[0];
  if (accessCode.visitDate !== today) {
    return {
      result: 'denied',
      reason: `Access code is valid for ${accessCode.visitDate}, not today`,
      reason_code: 'INVALID_DATE',
      code: accessCode.code,
      accessCodeId: accessCode.id,
      residentId: accessCode.residentId,
    };
  }
  
  // Check time
  const now = new Date();
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
  
  if (currentTime < accessCode.startTime) {
    return {
      result: 'denied',
      reason: `Access not yet active. Valid from ${accessCode.startTime}`,
      reason_code: 'TOO_EARLY',
      code: accessCode.code,
      accessCodeId: accessCode.id,
      residentId: accessCode.residentId,
    };
  }
  
  if (currentTime > accessCode.endTime) {
    return {
      result: 'denied',
      reason: `Access code expired at ${accessCode.endTime}`,
      reason_code: 'CODE_EXPIRED',
      code: accessCode.code,
      accessCodeId: accessCode.id,
      residentId: accessCode.residentId,
    };
  }
  
  // Check if already used (optional - can be configured)
  if (accessCode.status === 'used') {
    return {
      result: 'denied',
      reason: 'Access code has already been used',
      reason_code: 'CODE_ALREADY_USED',
      code: accessCode.code,
      accessCodeId: accessCode.id,
      residentId: accessCode.residentId,
    };
  }
  
  // All checks passed - GRANTED
  return {
    result: 'granted',
    code: accessCode.code,
    visitor_info: {
      name: accessCode.visitorName,
    },
    resident_info: {
      name: `${accessCode.resident.firstName} ${accessCode.resident.lastName}`,
      home: {
        name: accessCode.resident.home.name,
        plot_number: accessCode.resident.home.plotNumber,
        street: accessCode.resident.home.street,
      },
    },
    visit_details: {
      visit_date: accessCode.visitDate,
      start_time: accessCode.startTime,
      end_time: accessCode.endTime,
    },
    accessCodeId: accessCode.id,
    residentId: accessCode.residentId,
  };
};

exports.logEntry = async (validationResult, securityId, gate = 'Main Gate') => {
  // Ensure code is max 5 characters (database constraint)
  let codeToLog = validationResult.code || 'N/A';
  if (codeToLog.length > 5) {
    codeToLog = codeToLog.substring(0, 5);  // Truncate to 5 chars
  }
  
  const logData = {
    accessCodeId: validationResult.accessCodeId || null,
    code: codeToLog,
    residentId: validationResult.residentId || null,
    securityId,
    result: validationResult.result,
    reason: validationResult.reason || null,
    reasonCode: validationResult.reason_code || null,
    gate,
    validatedAt: new Date(),
  };
  
  const entryLog = await EntryLog.create(logData);
  
  // If granted, mark code as used (optional - can be configured)
  if (validationResult.result === 'granted' && validationResult.accessCodeId) {
    await AccessCode.update(
      { status: 'used', usedAt: new Date() },
      { where: { id: validationResult.accessCodeId } }
    );
  }
  
  return entryLog;
};

