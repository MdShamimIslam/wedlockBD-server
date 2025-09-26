import express from "express";
import {  addProfileView, getLast7DaysProfileViews,  } from "../controllers/profileViewController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addProfileView);
router.get("/last7days", verifyToken, getLast7DaysProfileViews);

export default router;

