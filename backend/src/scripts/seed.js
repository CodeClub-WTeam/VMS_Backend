require('dotenv').config();
const { Estate, Home, Resident, Admin, Security, sequelize } = require('../models');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Create Estate
    const estate = await Estate.create({
      name: 'Green Valley Estate',
      address: '123 Main Street, Accra, Ghana',
      isActive: true,
    });
    console.log('✅ Estate created: Green Valley Estate');
    
    // Create SuperAdmin
    const superAdmin = await Admin.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@vms.com',
      phone: '+233244123455',
      passwordHash: 'Password123!',
      role: 'superadmin',
    });
    console.log('✅ SuperAdmin created: superadmin@vms.com');
    
    // Create Admin (Estate Manager)
    const admin = await Admin.create({
      estateId: estate.id,
      firstName: 'Estate',
      lastName: 'Manager',
      email: 'admin@greenvally.com',
      phone: '+233244123456',
      passwordHash: 'Password123!',
      role: 'estate_manager',
    });
    console.log('✅ Estate Manager created: admin@greenvally.com');
    
    // Create Security
    const security = await Security.create({
      estateId: estate.id,
      firstName: 'Security',
      lastName: 'Guard',
      email: 'security1@greenvally.com',
      phone: '+233244123457',
      passwordHash: 'Password123!',
    });
    console.log('✅ Security account created: security1@greenvally.com');
    
    // Create Homes
    const homes = [];
    for (let i = 1; i <= 10; i++) {
      const home = await Home.create({
        estateId: estate.id,
        name: `Residence ${i}`,
        plotNumber: `A${i}`,
        street: `Palm Avenue`,
        contactEmail: `contact${i}@example.com`,
        contactPhone: `+23324412${String(i).padStart(4, '0')}`,
        isActive: true,
      });
      homes.push(home);
    }
    console.log(`✅ ${homes.length} homes created`);
    
    // Create Residents (2 per home for first 5 homes)
    let residentCount = 0;
    for (let i = 0; i < 5; i++) {
      // Primary resident
      await Resident.create({
        homeId: homes[i].id,
        firstName: 'John',
        lastName: `Resident${i + 1}`,
        email: `resident${i + 1}@example.com`,
        phone: `+23324499${String(i + 1).padStart(4, '0')}`,
        passwordHash: 'Password123!',
        status: 'active',
      });
      residentCount++;
      
      // Secondary resident
      await Resident.create({
        homeId: homes[i].id,
        firstName: 'Jane',
        lastName: `Resident${i + 1}`,
        email: `jane.resident${i + 1}@example.com`,
        phone: `+23324488${String(i + 1).padStart(4, '0')}`,
        passwordHash: 'Password123!',
        status: 'active',
      });
      residentCount++;
    }
    console.log(`✅ ${residentCount} residents created`);
    
    console.log('\n🎉 Database seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TEST ACCOUNTS (All use Password123!):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n👑 SUPER ADMIN:');
    console.log('   Email:    superadmin@vms.com');
    console.log('   Password: Password123!');
    console.log('   Endpoint: POST /api/v1/auth/admin/login');
    console.log('\n👨‍💼 ESTATE MANAGER (Admin):');
    console.log('   Email:    admin@greenvally.com');
    console.log('   Password: Password123!');
    console.log('   Endpoint: POST /api/v1/auth/admin/login');
    console.log('\n🔒 SECURITY GUARD:');
    console.log('   Email:    security1@greenvally.com');
    console.log('   Password: Password123!');
    console.log('   Endpoint: POST /api/v1/auth/security/login');
    console.log('\n🏠 RESIDENT:');
    console.log('   Email:    resident1@example.com');
    console.log('   Password: Password123!');
    console.log('   Endpoint: POST /api/v1/auth/login');
    console.log('\n   (More residents: resident2-5@example.com, jane.resident1-5@example.com)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('\n⚠️  Data may already exist. Drop and recreate database to reseed.\n');
    }
    process.exit(1);
  }
}

seed();

