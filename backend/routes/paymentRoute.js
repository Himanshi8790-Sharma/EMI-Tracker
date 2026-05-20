import express from 'express';
import { addPayment,getLoanPayments,getAllPayments  } from '../controller/paymentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
// for history
router.post("/add", verifyToken, addPayment);
router.get("/:loanId", verifyToken, getLoanPayments);
router.get("/", verifyToken, getAllPayments );

export default router;