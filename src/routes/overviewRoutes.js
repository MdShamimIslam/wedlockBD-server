import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { getOverviewOfNormalUser } from "../controllers/overviewController.js";

const router = express.Router();

router.get("/normal-user", verifyToken, getOverviewOfNormalUser);

export default router;

