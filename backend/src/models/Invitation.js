const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Invitation = sequelize.define(
    'Invitation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      role: {
        type: DataTypes.ENUM('superadmin', 'estate_manager', 'security', 'resident'),
        allowNull: false,
      },
      estateId: {
        type: DataTypes.UUID,
        allowNull: true, // null for superadmin
        field: 'estate_id',
      },
      homeId: {
        type: DataTypes.UUID,
        allowNull: true, // only for residents
        field: 'home_id',
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'expired', 'cancelled'),
        defaultValue: 'pending',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
      },
      invitedBy: {
        type: DataTypes.UUID,
        allowNull: true, // null for system-generated
        field: 'invited_by',
      },
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'accepted_at',
      },
    },
    {
      tableName: 'invitations',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['token'],
        },
        {
          fields: ['email'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['expires_at'],
        },
      ],
      hooks: {
        beforeCreate: async (invitation) => {
          // Generate secure token if not provided
          if (!invitation.token) {
            invitation.token = crypto.randomBytes(32).toString('hex');
          }
          // Set expiration to 7 days if not provided
          if (!invitation.expiresAt) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            invitation.expiresAt = expiryDate;
          }
        },
      },
    }
  );

  // Instance methods
  Invitation.prototype.isExpired = function () {
    return new Date() > this.expiresAt || this.status === 'expired';
  };

  Invitation.prototype.isValid = function () {
    return (
      this.status === 'pending' &&
      !this.isExpired()
    );
  };

  Invitation.prototype.markAsAccepted = async function () {
    this.status = 'accepted';
    this.acceptedAt = new Date();
    await this.save();
  };

  Invitation.prototype.toJSON = function () {
    const values = { ...this.get() };
    return values;
  };

  // Associations
  Invitation.associate = (models) => {
    Invitation.belongsTo(models.Estate, {
      foreignKey: 'estateId',
      as: 'estate',
    });
    Invitation.belongsTo(models.Home, {
      foreignKey: 'homeId',
      as: 'home',
    });
    Invitation.belongsTo(models.Admin, {
      foreignKey: 'invitedBy',
      as: 'inviter',
    });
  };

  return Invitation;
};

