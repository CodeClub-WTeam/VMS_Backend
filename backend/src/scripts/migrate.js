require('dotenv').config();
const { sequelize } = require('../models');

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`🖥️  Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models (create tables)
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database migration completed successfully');
    console.log('\n📋 Tables created/updated:');
    console.log('  - estates');
    console.log('  - homes');
    console.log('  - residents (updated: name → firstName/lastName, added profilePicture)');
    console.log('  - admins (updated: name → firstName/lastName, added role, phone, profilePicture)');
    console.log('  - security_credentials (updated: username → email, added firstName/lastName, phone, profilePicture)');
    console.log('  - invitations (NEW - for invitation-based user creation)');
    console.log('  - access_codes');
    console.log('  - entry_logs\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nPlease check:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. Database exists (createdb vms_db)');
    console.error('  3. Credentials in .env are correct\n');
    process.exit(1);
  }
}

migrate();

