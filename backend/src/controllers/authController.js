const { Resident, Admin, Security, Home } = require('../models');
const { generateToken } = require('../config/auth');

// Resident Login
exports.residentLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find resident
    const resident = await Resident.findOne({
      where: { email, status: 'active' },
      include: [
        {
          model: Home,
          as: 'home',
          attributes: ['id', 'name', 'plotNumber', 'street'],
        },
      ],
    });
    
    if (!resident) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect',
        },
      });
    }
    
    // Verify password
    const isValidPassword = await resident.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect',
        },
      });
    }
    
    // Update last login
    await resident.update({ lastLogin: new Date() });
    
    // Generate token
    const token = generateToken({
      id: resident.id,
      role: 'resident',
      homeId: resident.homeId,
    });
    
    // Return response
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: resident.id,
          firstName: resident.firstName,
          lastName: resident.lastName,
          email: resident.email,
          phone: resident.phone,
          role: 'resident',
          home: resident.home,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Login
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({
      where: { email },
    });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect',
        },
      });
    }
    
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect',
        },
      });
    }
    
    await admin.update({ lastLogin: new Date() });
    
    const token = generateToken({
      id: admin.id,
      role: admin.role,
      estateId: admin.estateId,
    });
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role, // 'superadmin' or 'estate_manager'
          estateId: admin.estateId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Security Login
exports.securityLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const security = await Security.findOne({
      where: { email },
    });
    
    if (!security) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect',
        },
      });
    }
    
    const isValidPassword = await security.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect',
        },
      });
    }
    
    await security.update({ lastLogin: new Date() });
    
    const token = generateToken({
      id: security.id,
      role: 'security',
      estateId: security.estateId,
    });
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: security.id,
          firstName: security.firstName,
          lastName: security.lastName,
          email: security.email,
          role: 'security',
          estateId: security.estateId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify Token
exports.verifyToken = async (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user,
    },
  });
};

