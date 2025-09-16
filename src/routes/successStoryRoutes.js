import express from "express";
import { getSuccessStories, addSuccessStory } from "../controllers/successStoryController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// get all success stories
router.get("/", getSuccessStories);

// add a new success story
router.post("/", verifyToken, addSuccessStory);

export default router;
