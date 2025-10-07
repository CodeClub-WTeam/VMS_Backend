const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

/**
 * @swagger
 * /system/init:
 *   post:
 *     summary: Initialize SuperAdmin account (One-time setup)
 *     tags: [System]
 *     description: Creates the first SuperAdmin account. This endpoint can only be used once.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSuperAdminRequest'
 *     responses:
 *       201:
 *         description: SuperAdmin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: SuperAdmin account created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: First name, last name, email, and password are required
 *       409:
 *         description: SuperAdmin already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: SuperAdmin already exists. This endpoint can only be used once.
 */
router.post('/init', systemController.initSuperAdmin);

/**
 * @swagger
 * /system/status:
 *   get:
 *     summary: Get system initialization status
 *     tags: [System]
 *     description: Returns system status including initialization state and statistics
 *     responses:
 *       200:
 *         description: System status retrieved successfully
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
 *                     systemInitialized:
 *                       type: boolean
 *                       example: true
 *                       description: Whether SuperAdmin has been created
 *                     stats:
 *                       $ref: '#/components/schemas/DashboardStats'
 */
router.get('/status', systemController.getSystemStatus);

module.exports = router;

