const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const { validateCodeGeneration, validatePasswordChange, validateProfileUpdate } = require('../validators/codeValidator');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

// All routes require resident authentication
router.use(verifyToken);
router.use(requireRole('resident'));

/**
 * @swagger
 * /codes/generate:
 *   post:
 *     summary: Generate access code
 *     description: Generate a new 5-character access code with QR code
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visit_date
 *               - start_time
 *               - end_time
 *             properties:
 *               visit_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-10-05"
 *               start_time:
 *                 type: string
 *                 example: "14:00"
 *               end_time:
 *                 type: string
 *                 example: "18:00"
 *               visitor_name:
 *                 type: string
 *                 example: "Sarah Johnson"
 *     responses:
 *       201:
 *         description: Code generated successfully
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     code:
 *                       type: string
 *                       example: "XY4P9"
 *                     qr_code:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *                     visit_date:
 *                       type: string
 *                       format: date
 *                     start_time:
 *                       type: string
 *                       example: "14:00"
 *                     end_time:
 *                       type: string
 *                       example: "18:00"
 *                     visitor_name:
 *                       type: string
 *                       example: "Sarah Johnson"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     resident:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                           description: Combined firstName and lastName of resident
 *                         home:
 *                           type: string
 *                           example: "A5, Palm Avenue"
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/generate', validateCodeGeneration, codeController.generateCode);

/**
 * @swagger
 * /codes/my-codes:
 *   get:
 *     summary: Get my access codes
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, used, expired, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of access codes
 */
router.get('/my-codes', codeController.getMyCodes);

/**
 * @swagger
 * /codes/my-history:
 *   get:
 *     summary: Get my visit history
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Entry history
 */
router.get('/my-history', codeController.getMyHistory);

/**
 * @swagger
 * /codes/{id}:
 *   delete:
 *     summary: Cancel access code
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Code cancelled
 *       404:
 *         description: Code not found
 */
router.delete('/:id', codeController.cancelCode);

/**
 * @swagger
 * /codes/change-password:
 *   post:
 *     summary: Change own password
 *     description: Resident can change their own password (requires current password)
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - old_password
 *               - new_password
 *             properties:
 *               old_password:
 *                 type: string
 *                 example: "OldPassword123!"
 *               new_password:
 *                 type: string
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 *       422:
 *         description: Validation error
 */
router.post('/change-password', validatePasswordChange, codeController.changePassword);

/**
 * @swagger
 * /codes/profile:
 *   put:
 *     summary: Update own profile
 *     description: Resident can update their profile (email cannot be changed)
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *               phone:
 *                 type: string
 *                 example: "+233244123456"
 *               profile_picture:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Email or home cannot be changed
 *       422:
 *         description: Validation error
 */
router.put('/profile', validateProfileUpdate, codeController.updateProfile);

/**
 * @swagger
 * /codes/all-history:
 *   get:
 *     summary: Get all my codes history
 *     description: Get all access codes (generated + validated) with validation status
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, used, expired, cancelled]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Complete code history with validation status
 */
router.get('/all-history', codeController.getAllMyCodes);

module.exports = router;

