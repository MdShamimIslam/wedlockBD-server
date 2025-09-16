import express from "express";
import { addPremiumBio, getPremiumBioByEmail, deletePremiumBio } from "../controllers/premiumBioController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// add premium bio → only logged-in user
router.post("/", verifyToken, addPremiumBio);

// get premium bio by email → only logged-in user
router.get("/", verifyToken, getPremiumBioByEmail);

// delete premium bio → only logged-in user
router.delete("/:id", verifyToken, deletePremiumBio);

export default router;
