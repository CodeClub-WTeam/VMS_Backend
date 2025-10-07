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

