const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

/**
 * @swagger
 * /invitations/verify/{token}:
 *   get:
 *     summary: Verify invitation token (Public)
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *         example: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
 *     responses:
 *       200:
 *         description: Invitation is valid
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
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: newuser@example.com
 *                     role:
 *                       type: string
 *                       enum: [superadmin, estate_manager, security, resident]
 *                       example: resident
 *                     estate:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                           example: Green Valley Estate
 *                     home:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                           example: Residence 1
 *                         plotNumber:
 *                           type: string
 *                           example: A1
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-10-09T23:59:59.000Z
 *       400:
 *         description: Invalid or expired token
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
 *                   example: Invalid invitation token
 *       404:
 *         description: Invitation not found
 */
router.get('/verify/:token', invitationController.verifyInvitation);

/**
 * @swagger
 * /invitations/accept:
 *   post:
 *     summary: Accept invitation and create account (Public)
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcceptInvitationRequest'
 *     responses:
 *       201:
 *         description: Account created successfully
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
 *                   example: Account created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     role:
 *                       type: string
 *                       enum: [superadmin, estate_manager, security, resident]
 *                       example: resident
 *       400:
 *         description: Invalid request or token
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
 *                   example: Token, first name, last name, and password are required
 *       409:
 *         description: Email already registered
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
 *                   example: An account with this email already exists
 */
router.post('/accept', invitationController.acceptInvitation);

module.exports = router;

