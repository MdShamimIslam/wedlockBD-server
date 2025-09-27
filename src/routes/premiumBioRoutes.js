import express from "express";
import { addPremiumBio, getPremiumBioByEmail, deletePremiumBio } from "../controllers/premiumBioController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// only logged-in user routes
router.post("/", verifyToken, addPremiumBio);
router.get("/", verifyToken, getPremiumBioByEmail);
router.delete("/:id", verifyToken, deletePremiumBio);

export default router;
