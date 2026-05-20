import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { generateWhatsAppLink } from "../controller/reminderController.js";

const router = express.Router();

router.post("/whatsapp", verifyToken, generateWhatsAppLink);

export default router;