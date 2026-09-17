import express from "express";

import {
  addPayment,
  getLoanPayments,
  getAllPayments,
} from "../controller/paymentController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: EMI payment APIs
 */

/**
 * @swagger
 * /api/payments/add:
 *   post:
 *     summary: Add a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Payment added successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/add", verifyToken, addPayment);

/**
 * @swagger
 * /api/payments/{loanId}:
 *   get:
 *     summary: Get payments for a specific loan
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Payment history for the loan
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Server error
 */
router.get("/:loanId", verifyToken, getLoanPayments);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", verifyToken, getAllPayments);

export default router;