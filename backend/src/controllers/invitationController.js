const InvitationService = require('../services/invitationService');
const { Resident, Admin, Security } = require('../models');

/**
 * Verify invitation token (public endpoint)
 * GET /invitations/verify/:token
 */
exports.verifyInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const validation = await InvitationService.validateToken(token);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { invitation } = validation;

    // Return invitation details (without sensitive info)
    res.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        estate: invitation.estate,
        home: invitation.home,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept invitation and create user account (public endpoint)
 * POST /invitations/accept
 */
exports.acceptInvitation = async (req, res, next) => {
  try {
    const { token, firstName, lastName, phone, profilePicture, password } = req.body;

    // Validate required fields
    if (!token || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token, first name, last name, and password are required',
      });
    }

    // Validate invitation
    const validation = await InvitationService.validateToken(token);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { invitation } = validation;

    // Check if email is already registered
    const emailExists = await InvitationService.isEmailRegistered(invitation.email);
    
    if (emailExists) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    // Create user based on role
    let user;
    const userData = {
      firstName,
      lastName,
      email: invitation.email,
      phone: phone || null,
      profilePicture: profilePicture || null,
      passwordHash: password, // Will be hashed by model hook
    };

    switch (invitation.role) {
      case 'resident':
        user = await Resident.create({
          ...userData,
          homeId: invitation.homeId,
          status: 'active',
          role: 'resident',
        });
        break;

      case 'estate_manager':
        user = await Admin.create({
          ...userData,
          estateId: invitation.estateId,
          role: 'estate_manager',
        });
        break;

      case 'security':
        user = await Security.create({
          ...userData,
          estateId: invitation.estateId,
        });
        break;

      case 'superadmin':
        user = await Admin.create({
          ...userData,
          estateId: null, // Superadmin not tied to estate
          role: 'superadmin',
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid role in invitation',
        });
    }

    // Mark invitation as accepted
    await invitation.markAsAccepted();

    // Return user data (without password)
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: user.toJSON(),
        role: invitation.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invitation details (for admin viewing)
 * GET /invitations/:id
 */
exports.getInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const invitations = await InvitationService.getPendingInvitations(null, {});
    const invitation = invitations.find(inv => inv.id === id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found',
      });
    }

    res.json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
};

