import express from "express";
import { getSuccessStories, addSuccessStory } from "../controllers/successStoryController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// only logged-in user routes
router.get("/", getSuccessStories);
router.post("/", verifyToken, addSuccessStory);

export default router;
