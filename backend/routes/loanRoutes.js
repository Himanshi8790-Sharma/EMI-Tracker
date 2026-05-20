import express, { Router } from "express";
import { addLoan,getLoans ,getSingleLoan,updateLoan,deleteLoan} from "../controller/loanController.js";
import {verifyToken} from "../middleware/authMiddleware.js";

const router = Router();

router.post("/add",verifyToken,addLoan);   //http://localhost:5000/api/loans/add
router.get("/",verifyToken,getLoans);
router.get("/:id",verifyToken,getSingleLoan);  // http://localhost:5000/api/loans/1   myloans

router.put("/:id", verifyToken, updateLoan); // http://localhost:5000/api/loans/1   myloan
router.delete("/:id", verifyToken, deleteLoan);

export default router;