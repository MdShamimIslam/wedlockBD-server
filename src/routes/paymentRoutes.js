import express from "express";
import { makePremium } from "../controllers/paymentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.patch("/make-premium/:biodataId", verifyToken, makePremium);

export default router;
