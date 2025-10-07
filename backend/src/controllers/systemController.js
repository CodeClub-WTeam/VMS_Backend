const { Admin } = require('../models');

/**
 * Initialize SuperAdmin account (one-time system setup)
 * POST /system/init
 * 
 * This endpoint creates the first superadmin account.
 * It should be protected or disabled after first use in production.
 */
exports.initSuperAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, email, and password are required',
      });
    }

    // Check if superadmin already exists
    const existingSuperAdmin = await Admin.findOne({
      where: { role: 'superadmin' },
    });

    if (existingSuperAdmin) {
      return res.status(409).json({
        success: false,
        error: 'SuperAdmin already exists. This endpoint can only be used once.',
      });
    }

    // Check if email is already in use
    const existingAdmin = await Admin.findOne({
      where: { email },
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    // Create superadmin
    const superAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      phone: phone || null,
      passwordHash: password, // Will be hashed by model hook
      role: 'superadmin',
      estateId: null, // Superadmin not tied to any estate
    });

    res.status(201).json({
      success: true,
      message: 'SuperAdmin account created successfully',
      data: {
        user: superAdmin.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system status
 * GET /system/status
 */
exports.getSystemStatus = async (req, res, next) => {
  try {
    const { Resident, Security, Estate, Home, AccessCode, EntryLog } = require('../models');

    const [
      superAdminExists,
      totalEstates,
      totalHomes,
      totalResidents,
      totalSecurity,
      totalAccessCodes,
      totalEntryLogs,
    ] = await Promise.all([
      Admin.count({ where: { role: 'superadmin' } }),
      Estate.count(),
      Home.count(),
      Resident.count(),
      Security.count(),
      AccessCode.count(),
      EntryLog.count(),
    ]);

    res.json({
      success: true,
      data: {
        systemInitialized: superAdminExists > 0,
        stats: {
          estates: totalEstates,
          homes: totalHomes,
          residents: totalResidents,
          security: totalSecurity,
          accessCodes: totalAccessCodes,
          entryLogs: totalEntryLogs,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

