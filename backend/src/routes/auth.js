const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateSecurityLogin } = require('../validators/authValidator');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Resident login
 *     tags: [Authentication]
 *     description: Login for residents using email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       422:
 *         description: Validation error
 */
router.post('/login', validateLogin, authController.residentLogin);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Authentication]
 *     description: |
 *       Login for estate managers and superadmins using email and password.
 *       
 *       **Role-Based Access:**
 *       - **SuperAdmin**: Full system access across all estates
 *       - **Estate Manager**: Limited access to their assigned estate only
 *       
 *       **JWT Token Payload:**
 *       - SuperAdmin: `{role: "superadmin", estateId: null}`
 *       - Estate Manager: `{role: "estate_manager", estateId: "uuid"}`
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: JWT token containing role and estate information
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "admin@greenvally.com"
 *                         role:
 *                           type: string
 *                           enum: [superadmin, estate_manager]
 *                           example: "superadmin"
 *                           description: |
 *                             User role determining access level:
 *                             - `superadmin`: Full system access
 *                             - `estate_manager`: Estate-specific access
 *                         estateId:
 *                           type: string
 *                           format: uuid
 *                           nullable: true
 *                           example: null
 *                           description: |
 *                             Estate ID (null for SuperAdmin, UUID for Estate Manager):
 *                             - SuperAdmin: `null` (access to all estates)
 *                             - Estate Manager: UUID of their assigned estate
 *                         phone:
 *                           type: string
 *                           example: "+233244123455"
 *                         profilePicture:
 *                           type: string
 *                           nullable: true
 *                           example: "https://example.com/avatar.jpg"
 *                         lastLogin:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-10-04T12:30:00.000Z"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-10-03T22:27:21.138Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2025-10-04T12:30:00.000Z"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "INVALID_CREDENTIALS"
 *                     message:
 *                       type: string
 *                       example: "Email or password is incorrect"
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/admin/login', validateLogin, authController.adminLogin);

/**
 * @swagger
 * /auth/security/login:
 *   post:
 *     summary: Security guard login
 *     tags: [Authentication]
 *     description: Login for security guards using email and password (updated from username)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INVALID_CREDENTIALS
 *                     message:
 *                       type: string
 *                       example: Email or password is incorrect
 *       422:
 *         description: Validation error
 */
router.post('/security/login', validateSecurityLogin, authController.securityLogin);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Token is invalid or expired
 */
router.get('/verify', verifyToken, authController.verifyToken);

module.exports = router;

