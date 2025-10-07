const crypto = require('crypto');
const { Invitation, Estate, Home, Admin } = require('../models');

class InvitationService {
  /**
   * Generate a secure random invitation token
   */
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new invitation
   */
  static async createInvitation({
    email,
    role,
    estateId = null,
    homeId = null,
    invitedBy = null,
    expiresInDays = 7,
  }) {
    // Validate role-specific requirements
    if (role === 'resident' && !homeId) {
      throw new Error('Home ID is required for resident invitations');
    }

    if ((role === 'security' || role === 'estate_manager') && !estateId) {
      throw new Error('Estate ID is required for security and estate manager invitations');
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await Invitation.findOne({
      where: {
        email,
        status: 'pending',
      },
    });

    if (existingInvitation && existingInvitation.isValid()) {
      throw new Error('A pending invitation already exists for this email');
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invitation
    const invitation = await Invitation.create({
      email,
      token: this.generateToken(),
      role,
      estateId,
      homeId,
      invitedBy,
      expiresAt,
      status: 'pending',
    });

    return invitation;
  }

  /**
   * Validate an invitation token
   */
  static async validateToken(token) {
    const invitation = await Invitation.findOne({
      where: { token },
      include: [
        {
          model: Estate,
          as: 'estate',
          attributes: ['id', 'name'],
        },
        {
          model: Home,
          as: 'home',
          attributes: ['id', 'name', 'plotNumber', 'street'],
        },
      ],
    });

    if (!invitation) {
      return {
        valid: false,
        error: 'Invalid invitation token',
      };
    }

    if (invitation.status !== 'pending') {
      return {
        valid: false,
        error: 'This invitation has already been used or cancelled',
      };
    }

    if (invitation.isExpired()) {
      // Mark as expired
      invitation.status = 'expired';
      await invitation.save();

      return {
        valid: false,
        error: 'This invitation has expired',
      };
    }

    return {
      valid: true,
      invitation,
    };
  }

  /**
   * Accept an invitation and create user account
   */
  static async acceptInvitation(token, userData) {
    // Validate token
    const validation = await this.validateToken(token);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const invitation = validation.invitation;

    // Mark invitation as accepted
    await invitation.markAsAccepted();

    return {
      invitation,
      role: invitation.role,
      estateId: invitation.estateId,
      homeId: invitation.homeId,
    };
  }

  /**
   * Cancel an invitation
   */
  static async cancelInvitation(invitationId) {
    const invitation = await Invitation.findByPk(invitationId);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Only pending invitations can be cancelled');
    }

    invitation.status = 'cancelled';
    await invitation.save();

    return invitation;
  }

  /**
   * Get all pending invitations for an estate
   */
  static async getPendingInvitations(estateId = null, filters = {}) {
    const where = {
      status: 'pending',
    };

    if (estateId) {
      where.estateId = estateId;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    const invitations = await Invitation.findAll({
      where,
      include: [
        {
          model: Estate,
          as: 'estate',
          attributes: ['id', 'name'],
        },
        {
          model: Home,
          as: 'home',
          attributes: ['id', 'name', 'plotNumber'],
        },
        {
          model: Admin,
          as: 'inviter',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return invitations;
  }

  /**
   * Resend an invitation (generate new token with extended expiry)
   */
  static async resendInvitation(invitationId) {
    const invitation = await Invitation.findByPk(invitationId);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Only pending invitations can be resent');
    }

    // Generate new token and extend expiry
    invitation.token = this.generateToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    invitation.expiresAt = newExpiresAt;

    await invitation.save();

    return invitation;
  }

  /**
   * Send invitation email (basic implementation)
   * In production, integrate with SendGrid, AWS SES, or similar
   */
  static async sendInvitationEmail(invitation) {
    // For now, just return the invitation link
    // In production, you would send an actual email here
    
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${invitation.token}`;

    // TODO: Integrate with email service
    // In development, log invitation details
    if (process.env.NODE_ENV === 'development') {
      console.log(`Invitation sent to ${invitation.email} for role ${invitation.role}`);
    }

    return {
      email: invitation.email,
      invitationLink,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Check if email is already registered
   */
  static async isEmailRegistered(email) {
    const { Resident, Admin, Security } = require('../models');

    const [resident, admin, security] = await Promise.all([
      Resident.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
      Security.findOne({ where: { email } }),
    ]);

    return !!(resident || admin || security);
  }
}

module.exports = InvitationService;

