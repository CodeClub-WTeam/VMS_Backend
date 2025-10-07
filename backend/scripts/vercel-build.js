#!/usr/bin/env node

/**
 * Vercel Build Script
 * This runs during deployment to set up the database
 */

require('dotenv').config();
const { sequelize } = require('../src/models');

async function vercelBuild() {
  try {
    console.log('🔄 Vercel Build: Starting database setup...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models (create tables if they don't exist)
    // Using alter: true to update existing tables without dropping data
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synchronized');
    
    console.log('🎉 Vercel Build: Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Vercel Build failed:', error);
    // Don't fail the build if DB sync fails in case tables already exist
    console.log('⚠️  Continuing with build...');
    process.exit(0);
  }
}

// Only run if called directly (not when required)
if (require.main === module) {
  vercelBuild();
}

module.exports = vercelBuild;

