const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const { validateCodeGeneration } = require('../validators/codeValidator');
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

module.exports = router;

