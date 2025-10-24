import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { getUserStats, getOverviewOfNormalUser } from "../controllers/userStatsController.js";

const router = express.Router();

// public routes
router.get("/", getUserStats);
router.get("/normal-user", verifyToken, getOverviewOfNormalUser);

export default router;
