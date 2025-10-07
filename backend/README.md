# VMS Backend API

Visitor Management System - Backend API built with Node.js, Express, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Create database:**
```bash
createdb vms_db
```

4. **Run migrations:**
```bash
npm run migrate
```

5. **Seed test data:**
```bash
npm run seed
```

6. **Start development server:**
```bash
npm run dev
```

7. **Access API documentation:**
```
http://localhost:3000/api-docs
```

## 📋 Test Accounts

After seeding, use these accounts:

- **Admin:** `admin@greenvally.com` / `Admin123!`
- **Security:** `security_master` / `Security123!`
- **Resident:** `resident1@example.com` / `Password123!`

## 🛠️ Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests with coverage
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed test data

## 📚 API Documentation

Full API documentation available at `/api-docs` when server is running.

Base URL: `http://localhost:3000/api/v1`

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Sequelize models
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validators
│   └── scripts/         # Database scripts
├── tests/               # Test files
├── server.js            # Entry point
└── package.json
```

## 🔐 Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

## 📞 Support

For issues or questions, contact: support@codeclub.com

