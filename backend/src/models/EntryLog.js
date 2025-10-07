const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EntryLog = sequelize.define(
    'EntryLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      accessCodeId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'access_code_id',
      },
      code: {
        type: DataTypes.STRING(5),
        allowNull: false,
      },
      residentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'resident_id',
      },
      securityId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'security_id',
      },
      result: {
        type: DataTypes.ENUM('granted', 'denied'),
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      reasonCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'reason_code',
      },
      gate: {
        type: DataTypes.STRING(100),
        defaultValue: 'Main Gate',
      },
      validatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'validated_at',
      },
    },
    {
      tableName: 'entry_logs',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['access_code_id'],
        },
        {
          fields: ['resident_id'],
        },
        {
          fields: ['result'],
        },
        {
          fields: ['validated_at'],
        },
        {
          fields: ['validated_at', 'result'],
        },
      ],
    }
  );

  EntryLog.associate = (models) => {
    EntryLog.belongsTo(models.AccessCode, {
      foreignKey: 'accessCodeId',
      as: 'accessCode',
    });
    EntryLog.belongsTo(models.Resident, {
      foreignKey: 'residentId',
      as: 'resident',
    });
    EntryLog.belongsTo(models.Security, {
      foreignKey: 'securityId',
      as: 'security',
    });
  };

  return EntryLog;
};

