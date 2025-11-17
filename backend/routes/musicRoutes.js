// backend/routes/musicRoutes.js
import express from "express";
const router = express.Router();

import { getMusicByMood, getCombinedMusic, postMusicFeedback } from "../controllers/musicController.js";

// Place explicit/static routes first
router.get("/combined", getCombinedMusic);
router.post("/feedback", postMusicFeedback);

// Keep param route LAST so it doesn't accidentally match static paths like "combined" or "chatbot"
router.get("/:moodId", getMusicByMood);

export default router;
