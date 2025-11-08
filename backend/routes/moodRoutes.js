import express from "express";
import { getMoods, logMood, getUserMoodHistory } from "../controllers/moodController.js";

const router = express.Router();

router.get("/", getMoods);
router.post("/log", logMood);
router.get("/user/:userId/history", getUserMoodHistory); // optional helper

export default router;
