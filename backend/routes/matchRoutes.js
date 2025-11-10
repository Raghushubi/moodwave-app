import express from "express";
import { findMatches } from "../controllers/matchController.js";
const router = express.Router();
router.get(":moodId", findMatches); // Example: /api/match/happyId\nexport default router;
