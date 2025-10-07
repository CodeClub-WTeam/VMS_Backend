const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const Resident = sequelize.define(
    'Resident',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      homeId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'home_id',
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      profilePicture: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'profile_picture',
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      role: {
        type: DataTypes.STRING(20),
        defaultValue: 'resident',
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login',
      },
    },
    {
      tableName: 'residents',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['home_id'],
        },
        {
          unique: true,
          fields: ['email'],
        },
        {
          fields: ['status'],
        },
      ],
      hooks: {
        beforeCreate: async (resident) => {
          if (resident.passwordHash) {
            resident.passwordHash = await bcrypt.hash(resident.passwordHash, 10);
          }
        },
        beforeUpdate: async (resident) => {
          if (resident.changed('passwordHash')) {
            resident.passwordHash = await bcrypt.hash(resident.passwordHash, 10);
          }
        },
      },
    }
  );

  // Instance methods
  Resident.prototype.comparePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
  };

  Resident.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  };

  // Associations
  Resident.associate = (models) => {
    Resident.belongsTo(models.Home, {
      foreignKey: 'homeId',
      as: 'home',
    });
    Resident.hasMany(models.AccessCode, {
      foreignKey: 'residentId',
      as: 'accessCodes',
    });
    Resident.hasMany(models.EntryLog, {
      foreignKey: 'residentId',
      as: 'entryLogs',
    });
  };

  return Resident;
};

