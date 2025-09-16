import express from "express";
import { 
  checkAdmin,
  insertUser,
  getAllUsers,
  deleteUser,
  updateUser
} from "../controllers/userController.js";
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// public / logged-in user routes
router.post("/", insertUser);
router.get("/admin/:email", verifyToken, checkAdmin);
router.put("/:id", verifyToken, updateUser);

// admin-only routes
router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.delete("/:id", verifyToken, verifyAdmin, deleteUser);

export default router;
