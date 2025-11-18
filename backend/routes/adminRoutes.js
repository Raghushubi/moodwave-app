import express from "express";
import {
  adminLogin,
  listUsers,
  listMoodLogs,
  deleteUser,
} from "../controllers/adminController.js";

import { verifyToken, requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

// Public
router.post("/login", adminLogin);

// Protected
router.get("/users", verifyToken, requireAdmin, listUsers);
router.get("/moodlogs", verifyToken, requireAdmin, listMoodLogs);
router.delete("/users/:id", verifyToken, requireAdmin, deleteUser);

export default router;
