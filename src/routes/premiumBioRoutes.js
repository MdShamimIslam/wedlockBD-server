import express from "express";
import { addPremiumBio, getPremiumBio, updatePremiumBioStatus, deletePremiumBio } from "../controllers/premiumBioController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// only logged-in user routes
router.post("/make-premium/:biodataId", verifyToken, addPremiumBio);

// admin routes
router.get("/", verifyToken, verifyAdmin, getPremiumBio);
router.patch("/:biodataId", verifyToken, verifyAdmin, updatePremiumBioStatus);
router.delete("/:id", verifyToken, verifyAdmin, deletePremiumBio);

export default router;
