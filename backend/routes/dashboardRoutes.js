import express from "express";
import { getDashboard,markAsPaid } from "../controller/dashboardController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getDashboard);
router.patch("/:id/pay", verifyToken, markAsPaid);

export default router;