import express from "express";
import { 
  getMoods, 
  logMood, 
  getUserMoodHistory, 
  getSocialMatches    // <-- add this import
} from "../controllers/moodController.js";

const router = express.Router();

// Existing routes
router.get("/", getMoods);
router.post("/log", logMood);
router.get("/user/:userId/history", getUserMoodHistory); // optional helper

// 🆕 New route for social matching feature
router.get("/match/:userId", getSocialMatches);

export default router;
