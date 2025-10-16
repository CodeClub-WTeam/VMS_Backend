const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

// All routes require security authentication
router.use(verifyToken);
router.use(requireRole('security'));

/**
 * @swagger
 * /security/validate:
 *   post:
 *     summary: Validate access code
 *     description: Validate a 5-character access code manually entered
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "XY4P9"
 *                 minLength: 5
 *                 maxLength: 5
 *     responses:
 *       200:
 *         description: Validation result (granted or denied)
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
 *                     result:
 *                       type: string
 *                       enum: [granted, denied]
 *                       example: "granted"
 *                     code:
 *                       type: string
 *                       example: "XY4P9"
 *                     visitor_info:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Sarah Johnson"
 *                     resident_info:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                           description: Combined firstName and lastName of resident
 *                         home:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "Residence 5"
 *                             plot_number:
 *                               type: string
 *                               example: "A5"
 *                             street:
 *                               type: string
 *                               example: "Palm Avenue"
 *                     validated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid code format
 *       401:
 *         description: Unauthorized
 */
router.post('/validate', securityController.validateCode);

/**
 * @swagger
 * /security/validate-qr:
 *   post:
 *     summary: Validate QR code
 *     description: Validate an access code from QR scan
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qr_data
 *             properties:
 *               qr_data:
 *                 type: string
 *                 example: "XY4P9"
 *     responses:
 *       200:
 *         description: Validation result (same as manual validation)
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
 *                     result:
 *                       type: string
 *                       enum: [granted, denied]
 *                       example: "granted"
 *                     code:
 *                       type: string
 *                       example: "XY4P9"
 *                     visitor_info:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Sarah Johnson"
 *                     resident_info:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                           description: Combined firstName and lastName of resident
 *                         home:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "Residence 5"
 *                             plot_number:
 *                               type: string
 *                               example: "A5"
 *                             street:
 *                               type: string
 *                               example: "Palm Avenue"
 *                     validated_at:
 *                       type: string
 *                       format: date-time
 */
router.post('/validate-qr', securityController.validateQRCode);

/**
 * @swagger
 * /security/recent-validations:
 *   get:
 *     summary: Get recent validations
 *     description: Get list of recent code validations by this security guard
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of recent validations
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
 *                     validations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           code:
 *                             type: string
 *                             example: "XY4P9"
 *                           result:
 *                             type: string
 *                             example: "granted"
 *                           visitor_name:
 *                             type: string
 *                             example: "John Visitor"
 *                           resident_name:
 *                             type: string
 *                             example: "John Doe"
 *                             description: Combined firstName and lastName of resident
 *                           home:
 *                             type: string
 *                             example: "A5, Palm Avenue"
 *                           validated_at:
 *                             type: string
 *                             format: date-time
 */
router.get('/recent-validations', securityController.getRecentValidations);

module.exports = router;

