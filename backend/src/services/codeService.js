const { AccessCode } = require('../models');
const { Op } = require('sequelize');

// Generate random 5-character alphanumeric code
// Excluded: I, O, 0, 1 (to avoid confusion)
exports.generateRandomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Check if code is unique for the visit date
exports.isCodeUnique = async (code, visitDate) => {
  const existingCode = await AccessCode.findOne({
    where: {
      code,
      visitDate,
      status: { [Op.in]: ['active', 'used'] },
    },
  });
  return !existingCode;
};

// Generate unique code
exports.generateUniqueCode = async (visitDate) => {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!isUnique && attempts < maxAttempts) {
    code = exports.generateRandomCode();
    isUnique = await exports.isCodeUnique(code, visitDate);
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Unable to generate unique code. Please try again.');
  }
  
  return code;
};

// Recycle expired codes (can be run as cron job)
exports.recycleExpiredCodes = async () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 8);
  
  await AccessCode.update(
    { status: 'expired' },
    {
      where: {
        status: 'active',
        [Op.or]: [
          { visitDate: { [Op.lt]: today } },
          {
            visitDate: today,
            endTime: { [Op.lt]: currentTime },
          },
        ],
      },
    }
  );
};

