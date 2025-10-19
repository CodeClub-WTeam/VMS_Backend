require('dotenv').config();
const { sequelize } = require('../models');

async function addExpiredAtColumn() {
  try {
    console.log('🔄 Adding expired_at column to access_codes table...\n');
    
    // Add expired_at column
    await sequelize.query(`
      ALTER TABLE access_codes 
      ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP NULL;
    `);
    
    console.log('✅ Column added successfully\n');
    
    // Update existing expired codes with calculated expiredAt
    console.log('🔄 Updating existing expired codes...\n');
    
    await sequelize.query(`
      UPDATE access_codes 
      SET expired_at = (visit_date || ' ' || end_time)::timestamp
      WHERE status = 'expired' AND expired_at IS NULL;
    `);
    
    console.log('✅ Existing expired codes updated\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nThe expired_at column has been added.');
    console.log('Existing expired codes have been updated.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addExpiredAtColumn();

