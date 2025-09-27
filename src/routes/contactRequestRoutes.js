import express from "express";
import {getContactRequests,addContactRequest,deleteContactRequest,updateContactRequestStatus,checkContactRequestStatus } from "../controllers/contactRequestController.js";
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// only logged-in user
router.get("/", verifyToken, getContactRequests);
router.get("/check-status/:biodataId", verifyToken, checkContactRequestStatus);
router.post("/:biodataId", verifyToken, addContactRequest);

// admin only
router.delete("/:id", verifyToken, verifyAdmin, deleteContactRequest);
router.patch("/:id", verifyToken, verifyAdmin, updateContactRequestStatus);

export default router;
