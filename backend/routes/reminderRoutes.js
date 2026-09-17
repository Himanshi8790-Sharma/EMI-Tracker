import express from "express";

import { verifyToken } from "../middleware/authMiddleware.js";

import {
  generateWhatsAppLink,
} from "../controller/reminderController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: EMI reminder APIs
 */

/**
 * @swagger
 * /api/reminders/whatsapp:
 *   post:
 *     summary: Generate WhatsApp reminder link
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               name:
 *                 type: string
 *                 example: Himanshi
 *               loan_name:
 *                 type: string
 *                 example: Home Loan
 *               amount:
 *                 type: number
 *                 example: 15000
 *               due_date:
 *                 type: string
 *                 example: "2026-09-20"
 *     responses:
 *       200:
 *         description: WhatsApp link generated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/whatsapp", verifyToken, generateWhatsAppLink);

export default router;