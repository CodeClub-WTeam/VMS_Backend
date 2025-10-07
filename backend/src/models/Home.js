const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Home = sequelize.define(
    'Home',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      estateId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'estate_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 255],
        },
      },
      plotNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'plot_number',
        validate: {
          notEmpty: true,
        },
      },
      street: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      contactEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'contact_email',
        validate: {
          isEmail: true,
        },
      },
      contactPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'contact_phone',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'homes',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['estate_id', 'plot_number'],
        },
        {
          fields: ['estate_id'],
        },
        {
          fields: ['plot_number'],
        },
      ],
    }
  );

  Home.associate = (models) => {
    Home.belongsTo(models.Estate, {
      foreignKey: 'estateId',
      as: 'estate',
    });
    Home.hasMany(models.Resident, {
      foreignKey: 'homeId',
      as: 'residents',
    });
  };

  return Home;
};

