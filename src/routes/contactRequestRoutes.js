import express from "express";
import {getContactRequests, getAllContactRequests, addContactRequest,deleteContactRequest,updateContactRequestStatus,checkContactRequestStatus } from "../controllers/contactRequestController.js";
import { verifyToken, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// only logged-in user
router.get("/", verifyToken, getContactRequests);
router.get("/check-status/:biodataId", verifyToken, checkContactRequestStatus);
router.post("/:biodataId", verifyToken, addContactRequest);

// admin only
router.get("/all", verifyToken, verifyAdmin, getAllContactRequests);
router.patch("/:id", verifyToken, verifyAdmin, updateContactRequestStatus);
router.delete("/:id", verifyToken, verifyAdmin, deleteContactRequest);

export default router;
