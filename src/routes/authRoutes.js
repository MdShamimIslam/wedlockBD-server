import express from "express";
import { createToken } from "../controllers/authController.js";

const router = express.Router();

// token generate
router.post("/", createToken);

export default router;
