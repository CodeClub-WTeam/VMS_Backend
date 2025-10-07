require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3000;

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully.');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        sequelize.close();
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT signal received: closing HTTP server');
      server.close(() => {
        sequelize.close();
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err.message);
    console.error('Please check your database configuration in .env file');
    process.exit(1);
  });

