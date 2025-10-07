const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions,
  }
);

const db = {};

// Import models
db.Estate = require('./Estate')(sequelize);
db.Home = require('./Home')(sequelize);
db.Resident = require('./Resident')(sequelize);
db.Admin = require('./Admin')(sequelize);
db.Security = require('./Security')(sequelize);
db.AccessCode = require('./AccessCode')(sequelize);
db.EntryLog = require('./EntryLog')(sequelize);
db.Invitation = require('./Invitation')(sequelize);

// Define associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

