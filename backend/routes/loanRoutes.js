import express, { Router } from "express";

import {
  addLoan,
  getLoans,
  getSingleLoan,
  updateLoan,
  deleteLoan,
} from "../controller/loanController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Loan management APIs
 */
/**
 * @swagger
 * /api/loans/add:
 *   post:
 *     summary: Add a new loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loan_name
 *               - total_amount
 *               - emi_amount
 *               - total_emis
 *               - next_due_date
 *             properties:
 *               loan_name:
 *                 type: string
 *                 example: Home Loan
 *               total_amount:
 *                 type: number
 *                 example: 500000
 *               emi_amount:
 *                 type: number
 *                 example: 15000
 *               total_emis:
 *                 type: integer
 *                 example: 36
 *               remaining_emis:
 *                 type: integer
 *                 example: 36
 *               interest_rate:
 *                 type: number
 *                 example: 8.5
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-01"
 *               next_due_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-01"
 *               payer_type:
 *                 type: string
 *                 example: self
 *               payer_name:
 *                 type: string
 *                 example: Himanshi
 *               payer_phone:
 *                 type: string
 *                 example: "9876543210"
 *               payer_email:
 *                 type: string
 *                 example: himanshi@example.com
 *               color:
 *                 type: string
 *                 example: "#7F77DD"
 *               notes:
 *                 type: string
 *                 example: Monthly home loan EMI
 *     responses:
 *       201:
 *         description: Loan added successfully
 *       400:
 *         description: Required fields missing
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/add", verifyToken, addLoan);

/**
 * @swagger
 * /api/loans:
 *   get:
 *     summary: Get all loans
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of loans
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", verifyToken, getLoans);

/**
 * @swagger
 * /api/loans/{id}:
 *   get:
 *     summary: Get a single loan
 *     tags: [Loans]
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
 *         description: Loan details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Server error
 */
router.get("/:id", verifyToken, getSingleLoan);

/**
 * @swagger
 * /api/loans/{id}:
 *   put:
 *     summary: Update a loan
 *     tags: [Loans]
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
 *         description: Loan updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Server error
 */
router.put("/:id", verifyToken, updateLoan);

/**
 * @swagger
 * /api/loans/{id}:
 *   delete:
 *     summary: Delete a loan
 *     tags: [Loans]
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
 *         description: Loan deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", verifyToken, deleteLoan);

export default router;