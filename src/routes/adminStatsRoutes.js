import express from "express";
import { getAdminStats, getAdminPieChartStats } from "../controllers/adminStatsController.js";
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All admin stats routes → admin-only
router.get("/", verifyToken, verifyAdmin, getAdminStats);
router.get("/pieChart", verifyToken, verifyAdmin, getAdminPieChartStats);

export default router;
