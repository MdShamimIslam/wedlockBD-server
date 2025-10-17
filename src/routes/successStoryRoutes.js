import express from "express";
import { getSuccessStories, addSuccessStory, deleteStory } from "../controllers/successStoryController.js";
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getSuccessStories);
// only logged-in user routes
router.post("/", verifyToken, addSuccessStory);

// only admin routes
router.delete("/:id", verifyToken, verifyAdmin, deleteStory);

export default router;
