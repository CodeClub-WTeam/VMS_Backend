const { Home, Resident, EntryLog, AccessCode, Security, Estate, Invitation, Admin } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const InvitationService = require('../services/invitationService');

// ==================== INVITATION MANAGEMENT ====================

// Send invitation to new user
exports.sendInvitation = async (req, res, next) => {
  try {
    const { email, role, estate_id, home_id } = req.body;
    const invitedBy = req.user.id;

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email and role are required',
      });
    }

    // Check if email is already registered
    const emailExists = await InvitationService.isEmailRegistered(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    // For estate managers and security, use the admin's estate if not provided
    let estateIdToUse = estate_id;
    if (!estateIdToUse && (role === 'estate_manager' || role === 'security')) {
      estateIdToUse = req.user.estateId;
    }

    // Create invitation
    const invitation = await InvitationService.createInvitation({
      email,
      role,
      estateId: estateIdToUse,
      homeId: home_id,
      invitedBy,
    });

    // Send invitation email
    const emailData = await InvitationService.sendInvitationEmail(invitation);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitation,
        email_sent: emailData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all pending invitations
exports.getInvitations = async (req, res, next) => {
  try {
    const { role } = req.query;
    const estateId = req.user.role === 'superadmin' ? null : req.user.estateId;

    const invitations = await InvitationService.getPendingInvitations(estateId, { role });

    res.json({
      success: true,
      data: { invitations },
    });
  } catch (error) {
    next(error);
  }
};

// Resend invitation
exports.resendInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invitation = await InvitationService.resendInvitation(id);
    const emailData = await InvitationService.sendInvitationEmail(invitation);

    res.json({
      success: true,
      message: 'Invitation resent successfully',
      data: {
        invitation,
        email_sent: emailData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cancel invitation
exports.cancelInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    await InvitationService.cancelInvitation(id);

    res.json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== HOME MANAGEMENT ====================

// Get all homes
exports.getHomes = async (req, res, next) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    
    const where = isSuperAdmin ? {} : { estateId };
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { plotNumber: { [Op.iLike]: `%${search}%` } },
        { street: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    const includeOptions = [
      {
        model: Resident,
        as: 'residents',
        attributes: ['id', 'firstName', 'lastName', 'status'],
      },
    ];

    // Add estate info for SuperAdmin
    if (isSuperAdmin) {
      includeOptions.push({
        model: Estate,
        as: 'estate',
        attributes: ['id', 'name', 'address'],
      });
    }

    const { count, rows } = await Home.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: includeOptions,
    });
    
    const homes = rows.map((home) => {
      const homeJson = home.toJSON();
      return {
        ...homeJson,
        resident_count: homeJson.residents?.length || 0,
        residents: undefined, // Remove full resident list
      };
    });
    
    res.json({
      success: true,
      data: {
        homes,
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

// Get single home by ID
exports.getHomeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    
    const where = isSuperAdmin ? { id } : { id, estateId };
    
    const home = await Home.findOne({
      where,
      include: [
        {
          model: Resident,
          as: 'residents',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status'],
        },
      ],
    });
    
    if (!home) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'HOME_NOT_FOUND',
          message: 'Home not found',
        },
      });
    }
    
    res.json({
      success: true,
      data: { home },
    });
  } catch (error) {
    next(error);
  }
};

// Add new home
exports.addHome = async (req, res, next) => {
  try {
    const { name, plot_number, street, contact_email, contact_phone, estate_id } = req.body;
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = estate_id || req.user.estateId;
    
    // SuperAdmin must provide estate_id when creating homes
    if (isSuperAdmin && !estate_id) {
      return res.status(400).json({
        success: false,
        error: 'Estate ID is required when creating homes as SuperAdmin',
      });
    }
    
    // Check if plot number already exists
    const existing = await Home.findOne({
      where: { estateId, plotNumber: plot_number },
    });
    
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'PLOT_NUMBER_EXISTS',
          message: `Plot number ${plot_number} already exists in this estate`,
        },
      });
    }
    
    const home = await Home.create({
      estateId,
      name,
      plotNumber: plot_number,
      street,
      contactEmail: contact_email,
      contactPhone: contact_phone,
    });
    
    res.status(201).json({
      success: true,
      data: { home },
      message: 'Home registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update home
exports.updateHome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    
    const where = isSuperAdmin ? { id } : { id, estateId };
    const home = await Home.findOne({ where });
    
    if (!home) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'HOME_NOT_FOUND',
          message: 'Home not found',
        },
      });
    }
    
    // Map frontend field names to database field names
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.plot_number !== undefined) updateData.plotNumber = updates.plot_number;
    if (updates.street !== undefined) updateData.street = updates.street;
    if (updates.contact_email !== undefined) updateData.contactEmail = updates.contact_email;
    if (updates.contact_phone !== undefined) updateData.contactPhone = updates.contact_phone;
    if (updates.is_active !== undefined) updateData.isActive = updates.is_active;
    
    await home.update(updateData);
    
    res.json({
      success: true,
      data: { home },
      message: 'Home updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete home
exports.deleteHome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    
    const where = isSuperAdmin ? { id } : { id, estateId };
    const home = await Home.findOne({
      where,
      include: [{ model: Resident, as: 'residents' }],
    });
    
    if (!home) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'HOME_NOT_FOUND',
          message: 'Home not found',
        },
      });
    }
    
    if (home.residents && home.residents.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'HOME_HAS_RESIDENTS',
          message: `Cannot delete home with ${home.residents.length} active resident(s). Please reassign or remove residents first.`,
        },
      });
    }
    
    await home.destroy();
    
    res.json({
      success: true,
      message: 'Home deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RESIDENT MANAGEMENT ====================

// Get all residents
exports.getResidents = async (req, res, next) => {
  try {
    const { home_id, search, status = 'all', limit = 20, offset = 0 } = req.query;
    const estateId = req.user.estateId;
    const isSuperAdmin = req.user.role === 'superadmin';
    
    const where = {};
    
    // Filter by status
    if (status !== 'all') {
      where.status = status;
    }
    
    // Search by firstName, lastName, or email
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    const includeOptions = [
      {
        model: Home,
        as: 'home',
        attributes: ['id', 'name', 'plotNumber', 'street'],
        // SuperAdmin sees all homes, Estate Manager sees only their estate's homes
        ...(isSuperAdmin ? {} : { where: { estateId } }),
        required: true,
        // Include estate info for SuperAdmin
        ...(isSuperAdmin ? {
          include: [{
            model: Estate,
            as: 'estate',
            attributes: ['id', 'name', 'address'],
          }]
        } : {}),
      },
    ];
    
    // Filter by home
    if (home_id) {
      includeOptions[0].where = includeOptions[0].where || {};
      includeOptions[0].where.id = home_id;
    }
    
    const { count, rows } = await Resident.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: includeOptions,
    });
    
    res.json({
      success: true,
      data: {
        residents: rows,
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

// Get single resident by ID
exports.getResidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    
    const includeOptions = [
      {
        model: Home,
        as: 'home',
        attributes: ['id', 'name', 'plotNumber', 'street'],
        ...(isSuperAdmin ? {} : { where: { estateId } }),
        ...(isSuperAdmin ? {
          include: [{
            model: Estate,
            as: 'estate',
            attributes: ['id', 'name', 'address'],
          }]
        } : {}),
      },
      {
        model: AccessCode,
        as: 'accessCodes',
        limit: 10,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'code', 'visitDate', 'status', 'createdAt'],
      },
    ];

    const resident = await Resident.findOne({
      where: { id },
      include: includeOptions,
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
    
    res.json({
      success: true,
      data: { resident },
    });
  } catch (error) {
    next(error);
  }
};


// Update resident
exports.updateResident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const estateId = req.user.estateId;
    
    const resident = await Resident.findOne({
      where: { id },
      include: [
        {
          model: Home,
          as: 'home',
          where: { estateId },
        },
      ],
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
    
    // If changing home, verify new home exists
    if (updates.home_id && updates.home_id !== resident.homeId) {
      const newHome = await Home.findOne({
        where: { id: updates.home_id, estateId },
      });
      if (!newHome) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'HOME_NOT_FOUND',
            message: 'The specified home does not exist',
          },
        });
      }
    }
    
    // Map frontend field names
    const updateData = {};
    if (updates.firstName !== undefined || updates.first_name !== undefined) {
      updateData.firstName = updates.firstName || updates.first_name;
    }
    if (updates.lastName !== undefined || updates.last_name !== undefined) {
      updateData.lastName = updates.lastName || updates.last_name;
    }
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.home_id !== undefined) updateData.homeId = updates.home_id;
    
    await resident.update(updateData);
    await resident.reload({ include: [{ model: Home, as: 'home' }] });
    
    res.json({
      success: true,
      data: { resident },
      message: 'Resident updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete resident
exports.deleteResident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const estateId = req.user.estateId;
    
    const resident = await Resident.findOne({
      where: { id },
      include: [
        {
          model: Home,
          as: 'home',
          where: { estateId },
        },
      ],
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
    
    await resident.destroy();
    
    res.json({
      success: true,
      message: 'Resident deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Reset resident password
exports.resetResidentPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const estateId = req.user.estateId;
    
    const resident = await Resident.findOne({
      where: { id },
      include: [
        {
          model: Home,
          as: 'home',
          where: { estateId },
        },
      ],
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
    
    const tempPassword = new_password || `TempPass${Math.random().toString(36).slice(-8)}`;
    
    await resident.update({ passwordHash: tempPassword });
    
    res.json({
      success: true,
      data: {
        temporary_password: tempPassword,
      },
      message: 'Password reset successfully. Credentials sent to resident\'s email.',
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ENTRY LOGS & REPORTS ====================

// Get all entry logs
exports.getLogs = async (req, res, next) => {
  try {
    const {
      home_id,
      resident_id,
      result = 'all',
      from_date,
      to_date,
      limit = 50,
      offset = 0,
    } = req.query;
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    
    const where = {};
    
    // Filter by result
    if (result !== 'all') {
      where.result = result;
    }
    
    // Filter by date range
    if (from_date || to_date) {
      where.validatedAt = {};
      if (from_date) where.validatedAt[Op.gte] = new Date(from_date);
      if (to_date) where.validatedAt[Op.lte] = new Date(to_date + 'T23:59:59');
    }
    
    // Filter by resident
    if (resident_id) {
      where.residentId = resident_id;
    }
    
    const includeOptions = [
      {
        model: Resident,
        as: 'resident',
        attributes: ['id', 'firstName', 'lastName'],
        include: [
          {
            model: Home,
            as: 'home',
            attributes: ['id', 'name', 'plotNumber', 'street'],
            where: { estateId },
            required: true,
          },
        ],
      },
      {
        model: Security,
        as: 'security',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: AccessCode,
        as: 'accessCode',
        attributes: ['visitorName'],
      },
    ];
    
    // Filter by home
    if (home_id) {
      includeOptions[0].include[0].where.id = home_id;
    }
    
    const { count, rows } = await EntryLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['validatedAt', 'DESC']],
      include: includeOptions,
    });
    
    const logs = rows.map((log) => ({
      id: log.id,
      code: log.code,
      result: log.result,
      reason: log.reason,
      visitor_name: log.accessCode?.visitorName || 'Not provided',
      resident: log.resident ? {
        id: log.resident.id,
        name: `${log.resident.firstName} ${log.resident.lastName}`,
      } : null,
      home: log.resident?.home ? {
        id: log.resident.home.id,
        name: log.resident.home.name,
        plot_number: log.resident.home.plotNumber,
        street: log.resident.home.street,
      } : null,
      validated_at: log.validatedAt,
      gate: log.gate,
      guard: log.security ? {
        id: log.security.id,
        name: `${log.security.firstName} ${log.security.lastName}`,
        email: log.security.email,
      } : null,
    }));
    
    res.json({
      success: true,
      data: {
        logs,
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

// Export logs to CSV
exports.exportLogs = async (req, res, next) => {
  try {
    const { home_id, resident_id, result = 'all', from_date, to_date } = req.query;
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    
    const where = {};
    
    if (result !== 'all') {
      where.result = result;
    }
    
    if (from_date || to_date) {
      where.validatedAt = {};
      if (from_date) where.validatedAt[Op.gte] = new Date(from_date);
      if (to_date) where.validatedAt[Op.lte] = new Date(to_date + 'T23:59:59');
    }
    
    if (resident_id) {
      where.residentId = resident_id;
    }
    
    const includeOptions = [
      {
        model: Resident,
        as: 'resident',
        attributes: ['firstName', 'lastName'],
        include: [
          {
            model: Home,
            as: 'home',
            attributes: ['name', 'plotNumber', 'street'],
            where: { estateId },
            required: true,
          },
        ],
      },
      {
        model: Security,
        as: 'security',
        attributes: ['firstName', 'lastName', 'email'],
      },
      {
        model: AccessCode,
        as: 'accessCode',
        attributes: ['visitorName'],
      },
    ];
    
    if (home_id) {
      includeOptions[0].include[0].where.id = home_id;
    }
    
    const logs = await EntryLog.findAll({
      where,
      order: [['validatedAt', 'DESC']],
      include: includeOptions,
    });
    
    // Generate CSV
    const csvHeaders = 'Date,Time,Code,Result,Visitor Name,Resident,Home,Plot,Street,Gate,Guard\n';
    const csvRows = logs.map((log) => {
      const date = new Date(log.validatedAt);
      const residentName = log.resident ? `${log.resident.firstName} ${log.resident.lastName}` : 'Unknown';
      const guardName = log.security ? `${log.security.firstName} ${log.security.lastName}` : 'Unknown';
      return [
        date.toISOString().split('T')[0],
        date.toTimeString().split(' ')[0],
        log.code,
        log.result,
        log.accessCode?.visitorName || 'N/A',
        residentName,
        log.resident?.home?.name || 'Unknown',
        log.resident?.home?.plotNumber || 'N/A',
        log.resident?.home?.street || 'N/A',
        log.gate,
        guardName,
      ].map(field => `"${field}"`).join(',');
    }).join('\n');
    
    const csv = csvHeaders + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="visitor_logs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    const today = new Date().toISOString().split('T')[0];
    
    // Total homes
    const homeWhere = isSuperAdmin ? {} : { estateId };
    const totalHomes = await Home.count({
      where: homeWhere,
    });
    
    // Total residents
    const residentInclude = [
      {
        model: Home,
        as: 'home',
        attributes: [],
        ...(isSuperAdmin ? {} : { where: { estateId } }),
      },
    ];
    
    const totalResidents = await Resident.count({
      include: residentInclude,
    });
    
    // Active codes today
    const activeCodesTodayCount = await AccessCode.count({
      where: {
        visitDate: today,
        status: 'active',
      },
      include: [
        {
          model: Resident,
          as: 'resident',
          attributes: [],
          include: [
            {
              model: Home,
              as: 'home',
              where: { estateId },
              attributes: [],
            },
          ],
        },
      ],
    });
    
    // Entries today
    const entriesToday = await EntryLog.count({
      where: {
        validatedAt: {
          [Op.gte]: new Date(today),
          [Op.lt]: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: [
        {
          model: Resident,
          as: 'resident',
          attributes: [],
          include: [
            {
              model: Home,
              as: 'home',
              where: { estateId },
              attributes: [],
            },
          ],
        },
      ],
    });
    
    // Entries granted today
    const entriesGrantedToday = await EntryLog.count({
      where: {
        result: 'granted',
        validatedAt: {
          [Op.gte]: new Date(today),
          [Op.lt]: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: [
        {
          model: Resident,
          as: 'resident',
          attributes: [],
          include: [
            {
              model: Home,
              as: 'home',
              where: { estateId },
              attributes: [],
            },
          ],
        },
      ],
    });
    
    // Recent activity
    const recentActivity = await EntryLog.findAll({
      limit: 10,
      order: [['validatedAt', 'DESC']],
      include: [
        {
          model: Resident,
          as: 'resident',
          attributes: ['firstName', 'lastName'],
          include: [
            {
              model: Home,
              as: 'home',
              where: { estateId },
              attributes: [],
            },
          ],
        },
        {
          model: AccessCode,
          as: 'accessCode',
          attributes: ['visitorName'],
        },
      ],
    });
    
    const activity = recentActivity.map((log) => ({
      type: log.result === 'granted' ? 'entry_granted' : 'entry_denied',
      visitor: log.accessCode?.visitorName || 'Unknown',
      resident: log.resident ? `${log.resident.firstName} ${log.resident.lastName}` : 'Unknown',
      time: log.validatedAt,
    }));
    
    res.json({
      success: true,
      data: {
        total_homes: totalHomes,
        total_residents: totalResidents,
        active_codes_today: activeCodesTodayCount,
        entries_today: entriesToday,
        entries_granted_today: entriesGrantedToday,
        entries_denied_today: entriesToday - entriesGrantedToday,
        recent_activity: activity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SECURITY CREDENTIAL MANAGEMENT ====================

// Get security credentials
exports.getSecurityCredentials = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    
    const where = isSuperAdmin ? {} : { estateId };
    const includeOptions = isSuperAdmin ? [{
      model: Estate,
      as: 'estate',
      attributes: ['id', 'name', 'address'],
    }] : [];
    
    const securityList = await Security.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'email', 'lastLogin', 'lastPasswordChange'],
      include: includeOptions,
    });
    
    if (!securityList || securityList.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SECURITY_NOT_FOUND',
          message: 'No security personnel found for this estate',
        },
      });
    }
    
    res.json({
      success: true,
      data: {
        security_personnel: securityList,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reset security password
exports.resetSecurityPassword = async (req, res, next) => {
  try {
    const { security_id, new_password } = req.body;
    const isSuperAdmin = req.user.role === 'superadmin';
    const estateId = isSuperAdmin ? null : req.user.estateId;
    
    if (!security_id) {
      return res.status(400).json({
        success: false,
        error: 'Security ID is required',
      });
    }
    
    const where = isSuperAdmin ? { id: security_id } : { id: security_id, estateId };
    const security = await Security.findOne({
      where,
    });
    
    if (!security) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SECURITY_NOT_FOUND',
          message: 'Security personnel not found',
        },
      });
    }
    
    const tempPassword = new_password || `SecPass${Math.random().toString(36).slice(-8)}!`;
    
    await security.update({
      passwordHash: tempPassword,
    });
    
    res.json({
      success: true,
      data: {
        email: security.email,
        name: `${security.firstName} ${security.lastName}`,
        temporary_password: tempPassword,
      },
      message: 'Security password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

