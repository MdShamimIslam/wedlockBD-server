import express from "express";
import { createCheckoutSession } from "../controllers/paymentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/checkout-session/:biodataId", verifyToken, createCheckoutSession);

export default router;
