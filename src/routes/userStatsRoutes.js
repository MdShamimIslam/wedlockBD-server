import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { getUserStats, getOverviewOfNormalUser, getLast7DaysStats } from "../controllers/userStatsController.js";

const router = express.Router();

// public routes
router.get("/", getUserStats);
router.get("/normal-user", verifyToken, getOverviewOfNormalUser);
router.get("/last7days", verifyToken, getLast7DaysStats);

export default router;
