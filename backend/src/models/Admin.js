const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const Admin = sequelize.define(
    'Admin',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      estateId: {
        type: DataTypes.UUID,
        allowNull: true, // null for superadmin
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
      role: {
        type: DataTypes.ENUM('superadmin', 'estate_manager'),
        defaultValue: 'estate_manager',
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login',
      },
    },
    {
      tableName: 'admins',
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
        beforeCreate: async (admin) => {
          if (admin.passwordHash) {
            admin.passwordHash = await bcrypt.hash(admin.passwordHash, 10);
          }
        },
        beforeUpdate: async (admin) => {
          if (admin.changed('passwordHash')) {
            admin.passwordHash = await bcrypt.hash(admin.passwordHash, 10);
          }
        },
      },
    }
  );

  // Instance methods
  Admin.prototype.comparePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
  };

  Admin.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  };

  // Associations
  Admin.associate = (models) => {
    Admin.belongsTo(models.Estate, {
      foreignKey: 'estateId',
      as: 'estate',
    });
  };

  return Admin;
};

