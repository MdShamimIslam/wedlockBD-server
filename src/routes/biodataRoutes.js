import express from "express";
import { getLimitedBiodatas, getBiodatas, getBiodataByEmail, getBiodataById, insertBiodata, updateBiodata, makePremium, addProfileView, pairBiodata } from "../controllers/biodataController.js";
import { verifyAdmin, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// public routes
router.get("/byLimit", getLimitedBiodatas);
router.get("/", getBiodatas);
router.get("/byMail", verifyToken, getBiodataByEmail);
// admin routes only
router.get("/pair", verifyToken, verifyAdmin, pairBiodata);
// public routes
router.get("/:id", getBiodataById);
// logged in user routes
router.post("/", verifyToken, insertBiodata);
router.put("/", verifyToken, updateBiodata);
router.post("/add-profile-view", verifyToken, addProfileView);
router.patch("/premium/:email", verifyToken, makePremium);

export default router;
