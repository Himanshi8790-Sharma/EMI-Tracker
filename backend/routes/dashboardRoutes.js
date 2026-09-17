import express from "express";

import {
  getDashboard,
  markAsPaid,
} from "../controller/dashboardController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard and EMI payment status APIs
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", verifyToken, getDashboard);

/**
 * @swagger
 * /api/dashboard/{id}/pay:
 *   patch:
 *     summary: Mark an EMI as paid
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: EMI marked as paid
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/pay", verifyToken, markAsPaid);

export default router;