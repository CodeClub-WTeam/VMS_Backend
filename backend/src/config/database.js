require('dotenv').config();
const pg = require('pg');

// Vercel Postgres connection
const getVercelPostgresConfig = () => {
  // Check if we're using Vercel Postgres
  if (process.env.POSTGRES_URL) {
    return {
      url: process.env.POSTGRES_URL,
      dialect: 'postgres',
      dialectModule: pg,
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      pool: {
        max: 5,
        min: 1,
        acquire: 30000,
        idle: 10000,
      },
    };
  }
  
  // Fallback to individual environment variables
  return {
    username: process.env.POSTGRES_USER || process.env.DB_USER,
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.POSTGRES_DATABASE || process.env.DB_NAME,
    host: process.env.POSTGRES_HOST || process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000,
    },
  };
};

module.exports = {
  development: {
    // Use POSTGRES_URL if available (for Neon), otherwise use individual vars
    ...(process.env.POSTGRES_URL
      ? {
          url: process.env.POSTGRES_URL,
          dialect: 'postgres',
          dialectModule: pg,
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          },
        }
      : {
          username: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
          password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '',
          database: process.env.POSTGRES_DATABASE || process.env.DB_NAME || 'vms_db',
          host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT) || 5432,
          dialect: 'postgres',
          dialectModule: pg,
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          },
        }),
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: `${process.env.DB_NAME || 'vms_db'}_test`,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
  },
  production: getVercelPostgresConfig(),
};

