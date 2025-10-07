const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const Security = sequelize.define(
    'Security',
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
      lastPasswordChange: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'last_password_change',
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login',
      },
    },
    {
      tableName: 'security_credentials',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['estate_id'],
        },
        {
          unique: true,
          fields: ['email'],
        },
      ],
      hooks: {
        beforeCreate: async (security) => {
          if (security.passwordHash) {
            security.passwordHash = await bcrypt.hash(security.passwordHash, 10);
          }
        },
        beforeUpdate: async (security) => {
          if (security.changed('passwordHash')) {
            security.passwordHash = await bcrypt.hash(security.passwordHash, 10);
            security.lastPasswordChange = new Date();
          }
        },
      },
    }
  );

  // Instance methods
  Security.prototype.comparePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
  };

  Security.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  };

  // Associations
  Security.associate = (models) => {
    Security.belongsTo(models.Estate, {
      foreignKey: 'estateId',
      as: 'estate',
    });
    Security.hasMany(models.EntryLog, {
      foreignKey: 'securityId',
      as: 'entryLogs',
    });
  };

  return Security;
};

