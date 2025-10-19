require('dotenv').config();
const { Resident, Admin, Security, sequelize } = require('../models');

async function resetAllPasswords() {
  try {
    console.log('🔄 Starting password reset for all users...\n');
    
    const newPassword = 'Password123A';
    
    // Reset Resident passwords
    console.log('📱 Resetting Resident passwords...');
    const residents = await Resident.findAll();
    let residentCount = 0;
    
    for (const resident of residents) {
      await resident.update({ passwordHash: newPassword });
      residentCount++;
      console.log(`   ✅ ${resident.firstName} ${resident.lastName} (${resident.email})`);
    }
    
    console.log(`✅ ${residentCount} resident passwords reset\n`);
    
    // Reset Admin passwords
    console.log('👨‍💼 Resetting Admin passwords...');
    const admins = await Admin.findAll();
    let adminCount = 0;
    
    for (const admin of admins) {
      await admin.update({ passwordHash: newPassword });
      adminCount++;
      console.log(`   ✅ ${admin.firstName} ${admin.lastName} (${admin.email}) - ${admin.role}`);
    }
    
    console.log(`✅ ${adminCount} admin passwords reset\n`);
    
    // Reset Security passwords
    console.log('🔒 Resetting Security passwords...');
    const securities = await Security.findAll();
    let securityCount = 0;
    
    for (const security of securities) {
      await security.update({ passwordHash: newPassword });
      securityCount++;
      console.log(`   ✅ ${security.firstName} ${security.lastName} (${security.email})`);
    }
    
    console.log(`✅ ${securityCount} security passwords reset\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 PASSWORD RESET COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Summary:`);
    console.log(`   Residents: ${residentCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Security: ${securityCount}`);
    console.log(`   Total: ${residentCount + adminCount + securityCount}`);
    console.log(`\n🔑 All users can now login with:`);
    console.log(`   Password: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

resetAllPasswords();


