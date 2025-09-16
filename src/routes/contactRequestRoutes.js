import express from "express";
import {
  getContactRequests,
  addContactRequest,
  deleteContactRequest,
  updateContactRequestStatus,
} from "../controllers/contactRequestController.js";
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// get contact requests → only logged-in user
router.get("/", verifyToken, getContactRequests);

// add contact request → only logged-in user
router.post("/", verifyToken, addContactRequest);

// delete contact request → admin only
router.delete("/:id", verifyToken, verifyAdmin, deleteContactRequest);

// update contact request status → admin only
router.patch("/:id", verifyToken, verifyAdmin, updateContactRequestStatus);

export default router;
