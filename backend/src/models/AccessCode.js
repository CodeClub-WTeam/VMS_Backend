const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AccessCode = sequelize.define(
    'AccessCode',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(5),
        allowNull: false,
        validate: {
          len: [5, 5],
        },
      },
      residentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'resident_id',
      },
      visitDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'visit_date',
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'start_time',
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'end_time',
      },
      visitorName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'visitor_name',
      },
      status: {
        type: DataTypes.ENUM('active', 'used', 'expired', 'cancelled'),
        defaultValue: 'active',
      },
      qrCodeData: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'qr_code_data',
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'used_at',
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'cancelled_at',
      },
      expiredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expired_at',
      },
    },
    {
      tableName: 'access_codes',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['code'],
        },
        {
          fields: ['resident_id'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['visit_date'],
        },
        {
          fields: ['visit_date', 'status'],
        },
      ],
    }
  );

  // Instance method to calculate expiry timestamp
  AccessCode.prototype.getExpiryTimestamp = function () {
    // Combine visit_date and end_time to get expiry timestamp
    return new Date(`${this.visitDate}T${this.endTime}`);
  };

  // Instance method to check if code should be expired
  AccessCode.prototype.shouldBeExpired = function () {
    const now = new Date();
    const expiry = this.getExpiryTimestamp();
    return now > expiry;
  };

  // Override toJSON to include calculated expiredAt
  AccessCode.prototype.toJSON = function () {
    const values = { ...this.get() };
    
    // Calculate expiredAt if not set
    if (!values.expiredAt && values.visitDate && values.endTime) {
      values.expiredAt = this.getExpiryTimestamp().toISOString();
    }
    
    // Clean up - remove QR code data from list views (too large)
    // It's still available if explicitly requested
    if (values.qrCodeData && values.qrCodeData.length > 1000) {
      // Keep it for now, can be removed in specific endpoints if needed
    }
    
    return values;
  };

  AccessCode.associate = (models) => {
    AccessCode.belongsTo(models.Resident, {
      foreignKey: 'residentId',
      as: 'resident',
    });
    AccessCode.hasMany(models.EntryLog, {
      foreignKey: 'accessCodeId',
      as: 'entryLogs',
    });
  };

  return AccessCode;
};

