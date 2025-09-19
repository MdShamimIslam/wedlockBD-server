import express from "express";
import { contactCheckoutSession } from "../controllers/paymentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/make-premium/:biodataId", verifyToken, contactCheckoutSession);

export default router;
