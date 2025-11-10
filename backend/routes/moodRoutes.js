// backend/routes/moodRoutes.js
import express from "express";
import { getMoods, logMood, getUserMoodHistory } from "../controllers/moodController.js";

const router = express.Router();

// Get all moods
router.get("/", getMoods);

// Log a mood
router.post("/log", logMood);

// Get user mood history
router.get("/user/:userId/history", getUserMoodHistory);

export default router;
