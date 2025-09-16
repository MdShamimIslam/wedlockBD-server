import express from "express";
import {
  getLimitedBiodatas,
  getBiodatas,
  getBiodataByEmail,
  getBiodataById,
  insertBiodata,
  updateBiodata,
  makePremium
} from "../controllers/biodataController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// public routes
router.get("/byLimit", getLimitedBiodatas);
router.get("/", getBiodatas);
router.get("/byMail", verifyToken, getBiodataByEmail); // token required
router.get("/:id", getBiodataById);

// user routes
router.post("/", verifyToken, insertBiodata);
router.put("/", verifyToken, updateBiodata);
router.patch("/premium/:email", verifyToken, makePremium);

export default router;
