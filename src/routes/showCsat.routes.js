import { Router } from 'express';
import { getShowCsatAccess } from '../controllers/showCsat.controller.js';

const router = Router();

/**
 * @swagger
 * /show-csat:
 *   post:
 *     summary: Check if a user can access CSAT screens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Access result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 access:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing email
 *       500:
 *         description: Internal server error
 */
router.post('/', getShowCsatAccess);

export default router;
