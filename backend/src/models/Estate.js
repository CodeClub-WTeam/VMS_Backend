const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Estate = sequelize.define(
    'Estate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 255],
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'estates',
      underscored: true,
      timestamps: true,
    }
  );

  Estate.associate = (models) => {
    Estate.hasMany(models.Home, {
      foreignKey: 'estateId',
      as: 'homes',
    });
    Estate.hasMany(models.Admin, {
      foreignKey: 'estateId',
      as: 'admins',
    });
    Estate.hasMany(models.Security, {
      foreignKey: 'estateId',
      as: 'securityCredentials',
    });
  };

  return Estate;
};

