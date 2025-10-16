const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const {
  validateAddHome,
  validateUpdateHome,
  validateAddResident,
  validateUpdateResident,
  validateResetPassword,
  validateUUID,
} = require('../validators/adminValidator');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

// All routes require admin authentication (SuperAdmin or Estate Manager)
router.use(verifyToken);
router.use(requireRole('superadmin', 'estate_manager'));

// ==================== INVITATION MANAGEMENT ====================

/**
 * @swagger
 * /admin/invitations:
 *   post:
 *     summary: Send invitation to new user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Send an invitation to create a new user account. The user will receive an email with an invitation link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendInvitationRequest'
 *     responses:
 *       201:
 *         description: Invitation sent successfully
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
 *                   example: Invitation sent successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     invitation:
 *                       $ref: '#/components/schemas/Invitation'
 *                     email_sent:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           format: email
 *                         invitationLink:
 *                           type: string
 *                           example: http://localhost:3000/accept-invitation?token=abc123...
 *                         token:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email already exists
 */
router.post('/invitations', adminController.sendInvitation);

/**
 * @swagger
 * /admin/invitations:
 *   get:
 *     summary: Get all pending invitations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all pending invitations for the current estate (or all estates for SuperAdmin)
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [superadmin, estate_manager, security, resident]
 *         description: Filter invitations by role
 *     responses:
 *       200:
 *         description: List of pending invitations
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
 *                     invitations:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Invitation'
 *                           - type: object
 *                             properties:
 *                               estate:
 *                                 $ref: '#/components/schemas/Estate'
 *                               home:
 *                                 $ref: '#/components/schemas/Home'
 *                               inviter:
 *                                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/invitations', adminController.getInvitations);

/**
 * @swagger
 * /admin/invitations/{id}/resend:
 *   post:
 *     summary: Resend an invitation
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Resend an invitation with a new token and extended expiry date
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation resent successfully
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
 *                   example: Invitation resent successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     invitation:
 *                       $ref: '#/components/schemas/Invitation'
 *                     email_sent:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           format: email
 *                         invitationLink:
 *                           type: string
 *                         token:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Invitation not found
 */
router.post('/invitations/:id/resend', adminController.resendInvitation);

/**
 * @swagger
 * /admin/invitations/{id}:
 *   delete:
 *     summary: Cancel an invitation
 *     tags: [Admin]
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
 *         description: Invitation cancelled
 */
router.delete('/invitations/:id', adminController.cancelInvitation);

// ==================== HOME MANAGEMENT ====================

/**
 * @swagger
 * /admin/homes:
 *   get:
 *     summary: Get all homes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retrieve homes with role-based access:
 *       - **SuperAdmin**: Can view homes from all estates (includes estate information)
 *       - **Estate Manager**: Limited to homes in their estate only
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, plot number, or street
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of homes to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of homes to skip
 *     responses:
 *       200:
 *         description: List of homes (filtered by role permissions)
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
 *                     homes:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Home'
 *                           - type: object
 *                             properties:
 *                               estate:
 *                                 $ref: '#/components/schemas/Estate'
 *                                 description: Only included for SuperAdmin requests
 *                               residents:
 *                                 type: array
 *                                 items:
 *                                   $ref: '#/components/schemas/User'
 *                     total:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 */
router.get('/homes', adminController.getHomes);

/**
 * @swagger
 * /admin/homes/{id}:
 *   get:
 *     summary: Get single home by ID
 *     tags: [Admin]
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
 *         description: Home details
 *       404:
 *         description: Home not found
 */
router.get('/homes/:id', validateUUID, adminController.getHomeById);

/**
 * @swagger
 * /admin/homes:
 *   post:
 *     summary: Add new home
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Create a new home with role-based restrictions:
 *       - **SuperAdmin**: Must specify `estate_id` to assign home to any estate
 *       - **Estate Manager**: Home is automatically assigned to their estate (estate_id ignored)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - plot_number
 *               - street
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Biga Residence"
 *                 description: Home name
 *               plot_number:
 *                 type: string
 *                 example: "A12"
 *                 description: Unique plot number within the estate
 *               street:
 *                 type: string
 *                 example: "Palm Avenue"
 *                 description: Street address
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 example: "contact@biga.com"
 *                 description: Contact email for the home
 *               contact_phone:
 *                 type: string
 *                 example: "+233244123456"
 *                 description: Contact phone for the home
 *               estate_id:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *                 description: |
 *                   Estate ID (required for SuperAdmin, ignored for Estate Manager):
 *                   - SuperAdmin: Must specify which estate to add home to
 *                   - Estate Manager: Automatically uses their assigned estate
 *     responses:
 *       201:
 *         description: Home created successfully
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
 *                   example: Home created successfully
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Home'
 *                     - type: object
 *                       properties:
 *                         estate:
 *                           $ref: '#/components/schemas/Estate'
 *       400:
 *         description: Bad request (missing estate_id for SuperAdmin)
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Plot number already exists in the estate
 *       422:
 *         description: Validation error
 */
router.post('/homes', validateAddHome, adminController.addHome);

/**
 * @swagger
 * /admin/homes/{id}:
 *   put:
 *     summary: Update home
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               plot_number:
 *                 type: string
 *               street:
 *                 type: string
 *               contact_email:
 *                 type: string
 *               contact_phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Home updated
 *       404:
 *         description: Home not found
 */
router.put('/homes/:id', validateUpdateHome, adminController.updateHome);

/**
 * @swagger
 * /admin/homes/{id}:
 *   delete:
 *     summary: Delete home
 *     tags: [Admin]
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
 *         description: Home deleted
 *       400:
 *         description: Home has residents
 *       404:
 *         description: Home not found
 */
router.delete('/homes/:id', validateUUID, adminController.deleteHome);

// ==================== RESIDENT MANAGEMENT ====================

/**
 * @swagger
 * /admin/residents:
 *   get:
 *     summary: Get all residents
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retrieve residents with role-based access:
 *       - **SuperAdmin**: Can view residents from all estates
 *       - **Estate Manager**: Limited to residents in their estate only
 *     parameters:
 *       - in: query
 *         name: home_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by home ID (SuperAdmin can use any home_id, Estate Manager limited to their estate)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by first name, last name, or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *           default: all
 *         description: Filter by resident status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of residents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of residents to skip
 *     responses:
 *       200:
 *         description: List of residents (filtered by role permissions)
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
 *                     residents:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/User'
 *                           - type: object
 *                             properties:
 *                               home:
 *                                 $ref: '#/components/schemas/Home'
 *                               estate:
 *                                 $ref: '#/components/schemas/Estate'
 *                                 description: Only included for SuperAdmin requests
 *                     total:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 */
router.get('/residents', adminController.getResidents);

/**
 * @swagger
 * /admin/residents/{id}:
 *   get:
 *     summary: Get single resident by ID
 *     tags: [Admin]
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
 *         description: Resident details
 *       404:
 *         description: Resident not found
 */
router.get('/residents/:id', validateUUID, adminController.getResidentById);


/**
 * @swagger
 * /admin/residents/{id}:
 *   put:
 *     summary: Update resident
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *               home_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Resident updated
 *       404:
 *         description: Resident not found
 */
router.put('/residents/:id', validateUpdateResident, adminController.updateResident);

/**
 * @swagger
 * /admin/residents/{id}:
 *   delete:
 *     summary: Delete resident
 *     tags: [Admin]
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
 *         description: Resident deleted
 *       404:
 *         description: Resident not found
 */
router.delete('/residents/:id', validateUUID, adminController.deleteResident);

// REMOVED: Admin cannot reset resident passwords (security policy)
// Residents must use self-service password change: POST /api/v1/codes/change-password
// 
// /**
//  * @swagger
//  * /admin/residents/{id}/reset-password:
//  *   post:
//  *     summary: Reset resident password (DISABLED)
//  *     deprecated: true
//  *     tags: [Admin]
//  */
// router.post('/residents/:id/reset-password', validateResetPassword, adminController.resetResidentPassword);

// ==================== LOGS & REPORTS ====================

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Get all entry logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retrieve entry logs with role-based access:
 *       - **SuperAdmin**: Can view logs from all estates (includes estate information)
 *       - **Estate Manager**: Limited to logs from their assigned estate only
 *     parameters:
 *       - in: query
 *         name: home_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by home ID (SuperAdmin can use any home_id, Estate Manager limited to their estate)
 *       - in: query
 *         name: resident_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by resident ID
 *       - in: query
 *         name: result
 *         schema:
 *           type: string
 *           enum: [all, granted, denied]
 *           default: all
 *         description: Filter by entry result
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date (YYYY-MM-DD)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs to this date (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: List of entry logs (filtered by role permissions)
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
 *                     logs:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/EntryLog'
 *                           - type: object
 *                             properties:
 *                               resident:
 *                                 $ref: '#/components/schemas/User'
 *                               accessCode:
 *                                 $ref: '#/components/schemas/AccessCode'
 *                               security:
 *                                 $ref: '#/components/schemas/Security'
 *                               estate:
 *                                 $ref: '#/components/schemas/Estate'
 *                                 description: Only included for SuperAdmin requests
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     filters:
 *                       type: object
 *                       description: Applied filters for reference
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 */
router.get('/logs', adminController.getLogs);

/**
 * @swagger
 * /admin/logs/export:
 *   get:
 *     summary: Export logs to CSV
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: home_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: resident_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: result
 *         schema:
 *           type: string
 *           enum: [all, granted, denied]
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
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/logs/export', adminController.exportLogs);

/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retrieve dashboard statistics with role-based data scope:
 *       - **SuperAdmin**: System-wide statistics across all estates
 *       - **Estate Manager**: Statistics limited to their assigned estate
 *     responses:
 *       200:
 *         description: Dashboard statistics (filtered by role permissions)
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalResidents:
 *                           type: integer
 *                           example: 45
 *                           description: Total residents (all estates for SuperAdmin, single estate for Estate Manager)
 *                         activeResidents:
 *                           type: integer
 *                           example: 42
 *                           description: Active residents count
 *                         totalHomes:
 *                           type: integer
 *                           example: 10
 *                           description: Total homes count
 *                         occupiedHomes:
 *                           type: integer
 *                           example: 9
 *                           description: Homes with residents
 *                         totalSecurityGuards:
 *                           type: integer
 *                           example: 3
 *                           description: Total security guards (all estates for SuperAdmin, single estate for Estate Manager)
 *                         totalEstates:
 *                           type: integer
 *                           example: 2
 *                           description: Total estates (only included for SuperAdmin)
 *                         recentAccessCodes:
 *                           type: integer
 *                           example: 15
 *                           description: Access codes generated today
 *                         recentEntryLogs:
 *                           type: integer
 *                           example: 8
 *                           description: Entry logs from today
 *                     scope:
 *                       type: string
 *                       enum: [system, estate]
 *                       example: system
 *                       description: Data scope (system for SuperAdmin, estate for Estate Manager)
 *                     estate:
 *                       $ref: '#/components/schemas/Estate'
 *                       description: Estate information (only included for Estate Manager)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

// ==================== SECURITY MANAGEMENT ====================

/**
 * @swagger
 * /admin/security/credentials:
 *   get:
 *     summary: Get security credentials info
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retrieve security credentials with role-based access:
 *       - **SuperAdmin**: Can view security guards from all estates (includes estate information)
 *       - **Estate Manager**: Limited to security guards in their assigned estate only
 *     responses:
 *       200:
 *         description: Security credentials info (filtered by role permissions)
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
 *                     securityGuards:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Security'
 *                           - type: object
 *                             properties:
 *                               estate:
 *                                 $ref: '#/components/schemas/Estate'
 *                                 description: Only included for SuperAdmin requests
 *                               lastLogin:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Last login timestamp
 *                               isOnline:
 *                                 type: boolean
 *                                 description: Current online status
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     scope:
 *                       type: string
 *                       enum: [system, estate]
 *                       example: system
 *                       description: Data scope (system for SuperAdmin, estate for Estate Manager)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 */
router.get('/security/credentials', adminController.getSecurityCredentials);

/**
 * @swagger
 * /admin/security/reset-password:
 *   post:
 *     summary: Reset security password
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Reset security guard password with role-based restrictions:
 *       - **SuperAdmin**: Can reset password for any security guard
 *       - **Estate Manager**: Can only reset password for security guards in their estate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - security_id
 *               - new_password
 *             properties:
 *               security_id:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *                 description: Security guard ID to reset password for
 *               new_password:
 *                 type: string
 *                 example: "NewSecurityPass123!"
 *                 description: New password for the security guard
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *                   example: Security password reset successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     securityGuard:
 *                       $ref: '#/components/schemas/Security'
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Password update timestamp
 *       400:
 *         description: Bad request (invalid security_id or weak password)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions - trying to reset password for security guard from different estate)
 *       404:
 *         description: Security guard not found
 */
router.post('/security/reset-password', adminController.resetSecurityPassword);

module.exports = router;

